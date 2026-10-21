import { clips as config } from '../config.js';
import { getClips } from '../twitch/status.js';
import { log } from '../utils/logger.js';

// Poste chaque nouveau clip Twitch dans CLIPS_CHANNEL_ID.
// Rien n'est stocké : un clip déjà posté est reconnu parce que son lien est dans le salon.
// Le lien seul suffit, Discord affiche le lecteur du clip tout seul.

async function postNewClips(client) {
  const channelId = process.env.CLIPS_CHANNEL_ID;
  const login = process.env.TWITCH_LOGIN;
  if (!channelId || !login) return;

  const since = new Date(Date.now() - config.lookbackHours * 3_600_000);
  const found = await getClips(login, since);
  if (!found.length) return;

  const channel = await client.channels.fetch(channelId);
  const recent = await channel.messages.fetch({ limit: 100 });
  const posted = recent.map((m) => m.content).join('\n');

  for (const clip of found.filter((c) => !posted.includes(c.id))) {
    const game = clip.game_name ? ` · 🎮 ${clip.game_name}` : '';
    await channel.send({
      content: `🎬 **Nouveau clip** par **${clip.creator_name}**${game}\n${clip.url}`,
      allowedMentions: { parse: [] },
    });
    await log(client, { type: 'info', title: '🎬 Clip posté', description: `« ${clip.title} » par ${clip.creator_name}\n${clip.url}` });
  }
}

export function startClips(client) {
  const tick = () =>
    postNewClips(client).catch((error) => {
      console.error('❌ Clips :', error);
      log(client, { type: 'error', title: '❌ Clips', description: `\`${error.message}\`` });
    });
  tick();
  setInterval(tick, config.checkEveryMinutes * 60_000);
}
