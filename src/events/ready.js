import { Events } from 'discord.js';
import { log } from '../utils/logger.js';
import { checkConfig, formatReport } from '../utils/configCheck.js';
import { startLiveTracker } from '../twitch/liveTracker.js';
import { startCounters } from '../features/counters.js';
import { startClips } from '../features/clips.js';

export default {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);

    const report = await checkConfig(client);
    const problems = report.missing.length + report.invalid.length;
    if (problems) console.warn(`⚠️ Configuration :\n${formatReport(report).replace(/[*`]/g, '')}`);

    await log(client, {
      type: problems ? 'warn' : 'success',
      title: problems ? '🟠 Bot en ligne — configuration incomplète' : '🟢 Bot en ligne',
      description: `**${client.user.tag}** vient de démarrer.`,
      fields: [
        { name: 'Commandes chargées', value: String(client.commands.size), inline: true },
        { name: 'Configuration', value: formatReport(report).slice(0, 1024) },
      ],
    });

    startLiveTracker(client);
    startCounters(client);
    startClips(client);
  },
};
