import { PermissionFlagsBits } from 'discord.js';
import { security, exemptRoleIds } from '../config.js';

const { antiSpam, antiLinks } = security;

// ── Exemptions ────────────────────────────────────────────
export function isExempt(member) {
  if (!member) return true;
  if (member.permissions.has(PermissionFlagsBits.ManageMessages)) return true;
  return member.roles.cache.some((role) => exemptRoleIds.includes(role.id));
}

// ── Anti-spam ─────────────────────────────────────────────
// userId → [{ time, content }]
const history = new Map();

export function checkSpam(message) {
  const now = Date.now();
  const keepMs = Math.max(antiSpam.perSeconds, antiSpam.duplicateSeconds) * 1000;
  // Version simplifiée du message pour les doublons : « SPAM !! », « spam. » et « s p a m » comptent pareil
  const content = message.content
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');

  const entries = (history.get(message.author.id) ?? []).filter((e) => now - e.time < keepMs);
  entries.push({ time: now, content });
  history.set(message.author.id, entries);

  const mentions = message.mentions.users.size + message.mentions.roles.size;
  if (mentions >= antiSpam.maxMentions) return 'mentions en masse';
  if (message.mentions.everyone) return 'mention @everyone/@here';

  const recent = entries.filter((e) => now - e.time < antiSpam.perSeconds * 1000);
  if (recent.length > antiSpam.maxMessages) return 'flood';

  if (content) {
    const dupes = entries.filter((e) => e.content === content && now - e.time < antiSpam.duplicateSeconds * 1000);
    if (dupes.length >= antiSpam.maxDuplicates) return 'messages en double';
  }

  return null;
}

// Nettoyage régulier pour ne pas garder l'historique indéfiniment
setInterval(() => {
  const cutoff = Date.now() - 60_000;
  for (const [id, entries] of history) {
    if (entries.every((e) => e.time < cutoff)) history.delete(id);
  }
}, 60_000).unref();

// ── Anti-liens / anti-scam ────────────────────────────────
const INVITE_REGEX = /(?:discord(?:app)?\.com\/invite|discord\.gg|dsc\.gg|invite\.gg)\/([\w-]+)/gi;
const URL_REGEX = /https?:\/\/([^\s/<>]+)/gi;

const OFFICIAL_DOMAINS = [
  'discord.com', 'discord.gg', 'discord.gift', 'discordapp.com', 'discordapp.net', 'discord.media',
  'steamcommunity.com', 'steampowered.com', 'store.steampowered.com',
  'twitch.tv', 'clips.twitch.tv', 'youtube.com', 'youtu.be', 'tenor.com', 'giphy.com',
];

// Mots qui, dans un nom de domaine non officiel, trahissent une arnaque (dlscord, steamcommunlty…)
const SCAM_DOMAIN_HINTS = /d[il1]sc[o0]r[dcl]|n[il1]tr[o0]|ste[a@]m|g[il1]ft|free-?skin|airdrop/i;
const SCAM_TEXT_HINTS = /(free|gratuit|offert).{0,30}(nitro|skin|steam)|(nitro|steam).{0,30}(free|gratuit|offert)/i;

// code → guildId (cache des invitations déjà vérifiées)
const inviteCache = new Map();

async function isOwnInvite(client, code, guildId) {
  if (!inviteCache.has(code)) {
    const invite = await client.fetchInvite(code).catch(() => null);
    inviteCache.set(code, invite?.guild?.id ?? null);
  }
  return inviteCache.get(code) === guildId;
}

function isOfficial(host) {
  host = host.toLowerCase().replace(/^www\./, '').split(':')[0];
  return OFFICIAL_DOMAINS.some((d) => host === d || host.endsWith('.' + d));
}

export async function checkLinks(message) {
  const text = message.content;

  if (antiLinks.blockInvites) {
    for (const [, code] of text.matchAll(INVITE_REGEX)) {
      if (!(await isOwnInvite(message.client, code, message.guild.id))) return 'invitation vers un autre serveur';
    }
  }

  if (antiLinks.blockScams) {
    const hosts = [...text.matchAll(URL_REGEX)].map(([, host]) => host);
    const suspicious = hosts.filter((host) => !isOfficial(host));
    if (suspicious.some((host) => SCAM_DOMAIN_HINTS.test(host))) return 'lien d\'arnaque';
    if (suspicious.length && SCAM_TEXT_HINTS.test(text)) return 'lien d\'arnaque';
  }

  return null;
}
