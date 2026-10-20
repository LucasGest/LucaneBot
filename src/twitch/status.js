// Statut live d'une chaîne Twitch : true (en live), false (hors ligne), null (inconnu / erreur)
// API officielle Twitch si TWITCH_CLIENT_ID + TWITCH_CLIENT_SECRET sont remplis, sinon decapi.me (sans clé)

let appToken = null; // { value, expires }

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

async function viaHelix(login) {
  const res = await fetch(`https://api.twitch.tv/helix/streams?user_login=${login}`, {
    headers: { 'Client-Id': process.env.TWITCH_CLIENT_ID, Authorization: `Bearer ${await getAppToken()}` },
  });
  if (res.status === 401) appToken = null;
  if (!res.ok) throw new Error(`API Twitch (${res.status})`);
  const { data } = await res.json();
  return data.length > 0;
}

async function viaDecapi(login) {
  const res = await fetch(`https://decapi.me/twitch/uptime/${login}`);
  if (!res.ok) throw new Error(`decapi (${res.status})`);
  const text = await res.text();
  if (/offline/i.test(text)) return false;
  if (/\d+\s*(second|minute|hour)/i.test(text)) return true;
  throw new Error(`Réponse decapi inattendue : ${text.slice(0, 100)}`);
}

export async function isLive(login) {
  try {
    const useHelix = process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET;
    return await (useHelix ? viaHelix(login) : viaDecapi(login));
  } catch (error) {
    console.error('⚠️ Statut Twitch indisponible :', error.message);
    return null;
  }
}
