import { PermissionFlagsBits } from 'discord.js';

// Vérifie les variables d'environnement au démarrage : présence, puis validité (salon/rôle existant, clés Twitch).
// Les valeurs ne sont jamais affichées, seulement les noms.
const VARIABLES = [
  { name: 'DISCORD_TOKEN', required: true },
  { name: 'CLIENT_ID', required: true },
  { name: 'GUILD_ID', required: true },
  { name: 'LOG_CHANNEL_ID', required: true, channel: 'logs' },
  { name: 'TWITCH_LOGIN', required: true },
  { name: 'TWITCH_CLIENT_ID', feature: 'titre/jeu du live, followers, clips' },
  { name: 'TWITCH_CLIENT_SECRET', feature: 'titre/jeu du live, followers, clips' },
  { name: 'LIVE_STATUS_CHANNEL_ID', feature: 'salon En ligne / Hors ligne', channel: 'renommer' },
  { name: 'LIVE_ANNOUNCE_CHANNEL_ID', feature: 'annonce de live', channel: 'écrire' },
  { name: 'LIVE_ROLE_ID', feature: 'rôle LIVE pendant le stream', role: true },
  { name: 'CLIPS_CHANNEL_ID', feature: 'clips Twitch', channel: 'écrire' },
  { name: 'HONEYPOT_CHANNEL_ID', feature: 'salon piège', channel: 'écrire' },
  { name: 'WELCOME_CHANNEL_ID', feature: 'image de bienvenue', channel: 'écrire' },
  { name: 'PLANNING_CHANNEL_ID', feature: 'planning', channel: 'écrire' },
  { name: 'SANCTIONS_CHANNEL_ID', feature: 'casier des sanctions', channel: 'écrire' },
  { name: 'MILESTONES_CHANNEL_ID', feature: 'fête des paliers de followers', channel: 'écrire' },
  { name: 'AUTO_ROLE_ID', feature: 'Followers à l\'arrivée', role: true },
];

async function checkChannel(client, id, need) {
  const channel = await client.channels.fetch(id).catch(() => null);
  if (!channel) return 'salon introuvable';
  const perms = channel.permissionsFor(client.user);
  if (!perms?.has(PermissionFlagsBits.ViewChannel)) return 'le bot ne voit pas ce salon';
  if (need === 'renommer' && !perms.has(PermissionFlagsBits.ManageChannels)) return 'le bot ne peut pas le renommer';
  // Discord exige aussi « Se connecter » pour modifier un salon vocal
  if (need === 'renommer' && channel.isVoiceBased() && !perms.has(PermissionFlagsBits.Connect)) return 'le bot doit pouvoir s\'y connecter pour le renommer';
  if ((need === 'écrire' || need === 'logs') && !perms.has(PermissionFlagsBits.SendMessages)) return 'le bot ne peut pas y écrire';
  return null;
}

async function checkRole(guild, id) {
  const role = await guild.roles.fetch(id).catch(() => null);
  if (!role) return 'rôle introuvable';
  if (role.position >= guild.members.me.roles.highest.position) return 'rôle au-dessus de Lucanebot';
  return null;
}

async function checkTwitch() {
  const params = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID,
    client_secret: process.env.TWITCH_CLIENT_SECRET,
    grant_type: 'client_credentials',
  });
  const res = await fetch(`https://id.twitch.tv/oauth2/token?${params}`, { method: 'POST' }).catch(() => null);
  return res?.ok ? null : 'clés Twitch refusées';
}

// { ok: [...], missing: [{ name, feature, required }], invalid: [{ name, problem }] }
export async function checkConfig(client) {
  const report = { ok: [], missing: [], invalid: [] };
  const guild = await client.guilds.fetch(process.env.GUILD_ID).catch(() => null);

  for (const variable of VARIABLES) {
    const value = process.env[variable.name]?.trim();
    if (!value) {
      report.missing.push(variable);
      continue;
    }
    let problem = null;
    if (variable.channel) problem = await checkChannel(client, value, variable.channel);
    else if (variable.role && guild) problem = await checkRole(guild, value);
    if (problem) report.invalid.push({ name: variable.name, problem });
    else report.ok.push(variable.name);
  }

  if (process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET) {
    const problem = await checkTwitch();
    if (problem) {
      report.ok = report.ok.filter((name) => !name.startsWith('TWITCH_CLIENT'));
      for (const name of ['TWITCH_CLIENT_ID', 'TWITCH_CLIENT_SECRET']) report.invalid.push({ name, problem });
    }
  }
  return report;
}

export function formatReport(report) {
  const total = report.ok.length + report.missing.length + report.invalid.length;
  const lines = [`**${report.ok.length}/${total}** variables OK`];
  for (const v of report.missing) lines.push(`${v.required ? '❌' : '⚠️'} \`${v.name}\` manquante${v.feature ? ` → ${v.feature} désactivé` : ' (obligatoire)'}`);
  for (const v of report.invalid) lines.push(`❌ \`${v.name}\` : ${v.problem}`);
  return lines.join('\n');
}
