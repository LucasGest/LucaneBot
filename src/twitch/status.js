// État d'une chaîne Twitch : { live, stream, user } ou null (inconnu / erreur)
// API officielle Twitch si TWITCH_CLIENT_ID + TWITCH_CLIENT_SECRET sont remplis, sinon decapi.me (sans clé,
// mais seulement en ligne / hors ligne, sans titre ni jeu)

let appToken = null; // { value, expires }
const users = new Map(); // login → { profile_image_url, display_name, … }

async function getAppToken() {
  if (appToken && Date.now() < appToken.expires) return appToken.value;
  const params = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID,
    client_secret: process.env.TWITCH_CLIENT_SECRET,
    grant_type: 'client_credentials',
  });
  const res = await fetch(`https://id.twitch.tv/oauth2/token?${params}`, { method: 'POST' });
  if (!res.ok) throw new Error(`Token Twitch refusé (${res.status})`);
  const data = await res.json();
  appToken = { value: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 };
  return appToken.value;
}

async function helix(path) {
  const res = await fetch(`https://api.twitch.tv/helix/${path}`, {
    headers: { 'Client-Id': process.env.TWITCH_CLIENT_ID, Authorization: `Bearer ${await getAppToken()}` },
  });
  if (res.status === 401) appToken = null;
  if (!res.ok) throw new Error(`API Twitch (${res.status})`);
  return (await res.json()).data;
}

async function getUser(login) {
  if (!users.has(login)) {
    const [user] = await helix(`users?login=${login}`);
    if (user) users.set(login, user);
  }
  return users.get(login) ?? null;
}

async function viaHelix(login) {
  const user = await getUser(login);
  const [stream] = await helix(`streams?user_login=${login}`);
  return { live: Boolean(stream), stream: stream ?? null, user };
}

// Nombre de followers (avec un token d'appli, Twitch ne donne que le total : c'est tout ce qu'il faut)
export async function getFollowerCount(login) {
  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) return null;
  try {
    const user = await getUser(login);
    if (!user) return null;
    const res = await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${user.id}`, {
      headers: { 'Client-Id': process.env.TWITCH_CLIENT_ID, Authorization: `Bearer ${await getAppToken()}` },
    });
    if (!res.ok) throw new Error(`API Twitch (${res.status})`);
    return (await res.json()).total;
  } catch (error) {
    console.error('⚠️ Followers Twitch indisponibles :', error.message);
    return null;
  }
}

async function viaDecapi(login) {
  const res = await fetch(`https://decapi.me/twitch/uptime/${login}`);
  if (!res.ok) throw new Error(`decapi (${res.status})`);
  const text = await res.text();
  if (/offline/i.test(text)) return { live: false, stream: null, user: null };
  if (/\d+\s*(second|minute|hour)/i.test(text)) return { live: true, stream: null, user: null };
  throw new Error(`Réponse decapi inattendue : ${text.slice(0, 100)}`);
}

export async function getChannelState(login) {
  try {
    const useHelix = process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET;
    return await (useHelix ? viaHelix(login) : viaDecapi(login));
  } catch (error) {
    console.error('⚠️ Statut Twitch indisponible :', error.message);
    return null;
  }
}
