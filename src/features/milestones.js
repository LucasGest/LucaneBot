import { EmbedBuilder } from 'discord.js';
import { milestones as config } from '../config.js';
import { getFollowerCount } from '../twitch/status.js';
import { log } from '../utils/logger.js';

// Fête les paliers de followers Twitch (300, 350, 400…) dans MILESTONES_CHANNEL_ID.
// Rien n'est stocké : un palier déjà fêté est reconnu grâce au message dans le salon.
// Une hausse brutale (follow-bots) ne déclenche pas de fête mais une alerte dans les logs.

const TITLE = (n) => `🎉 ${n} FOLLOWERS !`;
let lastCount = null;

// Que faire entre deux relevés ? { type: 'raid' } | { type: 'milestone', reached } | null
export function decide(previous, count) {
  if (previous === null) return null; // premier relevé après le démarrage : sert de référence
  if (count - previous >= config.raidAlertJump) return { type: 'raid' };
  const reached = Math.floor(count / config.step) * config.step;
  if (reached > previous && reached >= config.step) return { type: 'milestone', reached };
  return null;
}

async function check(client) {
  const login = process.env.TWITCH_LOGIN;
  const count = await getFollowerCount(login);
  if (count === null) return;

  const previous = lastCount;
  lastCount = count;
  const decision = decide(previous, count);
  if (!decision) return;

  if (decision.type === 'raid') {
    await log(client, {
      type: 'error',
      title: '🚨 Hausse suspecte de followers',
      description: `**+${count - previous}** followers en ${config.checkEveryMinutes} min (${previous} → ${count}).\nPossible raid de follow-bots : aucune fête de palier n'a été postée.`,
    });
    return;
  }

  const { reached } = decision;
  const channel = await client.channels.fetch(process.env.MILESTONES_CHANNEL_ID).catch(() => null);
  if (!channel) return;
  const recent = await channel.messages.fetch({ limit: 50 });
  if (recent.some((m) => m.author.id === client.user.id && m.embeds[0]?.title === TITLE(reached))) return;

  const embed = new EmbedBuilder()
    .setColor(0xff9f1c)
    .setTitle(TITLE(reached))
    .setDescription(`La chaîne vient de passer les **${reached} followers** sur Twitch ! Merci à tous pour le soutien 💜\n\nProchain cap : **${reached + config.step}** 🚀`)
    .setURL(`https://twitch.tv/${login}`)
    .setFooter({ text: 'Lucanebot · paliers de followers' })
    .setTimestamp();
  await channel.send({ embeds: [embed] });
  await log(client, { type: 'success', title: `🎉 Palier ${reached} followers fêté`, description: `${channel}` });
}

export function startMilestones(client) {
  if (!process.env.MILESTONES_CHANNEL_ID) return;
  const tick = () => check(client).catch((error) => console.error('❌ Paliers :', error.message));
  tick();
  setInterval(tick, config.checkEveryMinutes * 60_000);
}
