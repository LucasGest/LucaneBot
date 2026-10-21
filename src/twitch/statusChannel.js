import { twitch } from '../config.js';
import { log } from '../utils/logger.js';

// Salon renommé « En ligne » / « Hors ligne ».
// Discord limite à 2 renommages / 10 min par salon : on ne renomme que si le nom change vraiment.
async function rename(client, live, login) {
  const channelId = process.env.LIVE_STATUS_CHANNEL_ID;
  if (!channelId) return;

  const channel = await client.channels.fetch(channelId);
  const name = live ? twitch.onlineName : twitch.offlineName;
  if (channel.name === name) return;

  await channel.setName(name, live ? 'Live Twitch démarré' : 'Live Twitch terminé');
  await log(client, {
    type: live ? 'success' : 'info',
    title: live ? '🔴 Live démarré' : '⚫ Live terminé',
    description: `Salon ${channel} renommé en **${name}**\nhttps://twitch.tv/${login}`,
  });
}

export const onStart = (client, state, login) => rename(client, true, login);
// Rattrapage : si le renommage du début a échoué (permissions corrigées depuis), il est retenté à chaque contrôle.
// Sans risque pour la limite Discord : rename() ne fait rien si le nom est déjà le bon.
export const onUpdate = (client, state, login) => rename(client, true, login);
export const onEnd = (client, state, login) => rename(client, false, login);
