import { twitch } from '../config.js';
import { isLive } from './status.js';
import { log } from '../utils/logger.js';

// Renomme le salon de statut selon le live Twitch.
// Discord limite à 2 renommages / 10 min par salon : on ne renomme que sur un vrai changement,
// et on attend plusieurs vérifications "hors ligne" d'affilée pour ignorer les coupures de stream.
export function startLiveChannel(client) {
  const channelId = process.env.LIVE_STATUS_CHANNEL_ID;
  const login = process.env.TWITCH_LOGIN;
  if (!channelId || !login) return console.warn('⚠️ LIVE_STATUS_CHANNEL_ID ou TWITCH_LOGIN manquant : statut live désactivé');

  let current = null; // dernier état appliqué
  let offlineStreak = 0;
  let busy = false;

  async function tick() {
    if (busy) return;
    busy = true;
    try {
      const live = await isLive(login);
      if (live === null) return;

      offlineStreak = live ? 0 : offlineStreak + 1;
      if (!live && current !== null && offlineStreak < twitch.offlineConfirmations) return;
      if (live === current) return;

      const channel = await client.channels.fetch(channelId);
      const name = live ? twitch.onlineName : twitch.offlineName;
      if (channel.name !== name) {
        await channel.setName(name, live ? 'Live Twitch démarré' : 'Live Twitch terminé');
        await log(client, {
          type: live ? 'success' : 'info',
          title: live ? '🔴 Live démarré' : '⚫ Live terminé',
          description: `Salon ${channel} renommé en **${name}**\nhttps://twitch.tv/${login}`,
        });
      }
      current = live;
    } catch (error) {
      console.error('❌ Statut live :', error);
      await log(client, { type: 'error', title: '❌ Statut live', description: `\`${error.message}\`` });
    } finally {
      busy = false;
    }
  }

  tick();
  setInterval(tick, twitch.checkEverySeconds * 1000);
}
