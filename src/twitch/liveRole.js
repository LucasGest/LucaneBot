import { log } from '../utils/logger.js';

// Donne le rôle LIVE_ROLE_ID au streamer pendant le live (STREAMER_USER_ID, par défaut le propriétaire du serveur).
// Le rôle doit être sous celui du bot ; coche « Afficher séparément » pour remonter dans la liste des membres.
async function setLiveRole(client, live) {
  const roleId = process.env.LIVE_ROLE_ID;
  if (!roleId) return;

  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  const userId = process.env.STREAMER_USER_ID || guild.ownerId;
  const member = await guild.members.fetch(userId);
  if (member.roles.cache.has(roleId) === live) return;

  if (live) await member.roles.add(roleId, 'Live Twitch démarré');
  else await member.roles.remove(roleId, 'Live Twitch terminé');
  await log(client, {
    type: 'info',
    title: live ? '🔴 Rôle LIVE donné' : '⚫ Rôle LIVE retiré',
    description: `${member} ${live ? 'reçoit' : 'perd'} <@&${roleId}>`,
  });
}

export const onStart = (client) => setLiveRole(client, true);
export const onEnd = (client) => setLiveRole(client, false);
