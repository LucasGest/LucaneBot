import { Events } from 'discord.js';
import { log } from '../utils/logger.js';
import { startLiveTracker } from '../twitch/liveTracker.js';
import { startCounters } from '../features/counters.js';
import { startClips } from '../features/clips.js';

export default {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
    await log(client, {
      type: 'success',
      title: '🟢 Bot en ligne',
      description: `**${client.user.tag}** vient de démarrer.`,
      fields: [{ name: 'Commandes chargées', value: String(client.commands.size), inline: true }],
    });

    startLiveTracker(client);
    startCounters(client);
    startClips(client);
  },
};
