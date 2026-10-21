import { EmbedBuilder, escapeMarkdown } from 'discord.js';

// Casier des sanctions : chaque sanction est un message dans SANCTIONS_CHANNEL_ID (rien sur disque).
// Le pied de page « casier:<userId>:<type> » permet de retrouver l'historique d'un membre.

export const TYPES = {
  warn: { label: '⚠️ Avertissement', color: 0xff9f1c },
  timeout: { label: '⏳ Exclusion temporaire', color: 0xff9f1c },
  untimeout: { label: '✅ Fin d\'exclusion', color: 0x3ddc84 },
  kick: { label: '👢 Expulsion', color: 0xff4d6d },
  ban: { label: '🔨 Bannissement', color: 0xff4d6d },
  unban: { label: '🔓 Débannissement', color: 0x3ddc84 },
  automod: { label: '🛡️ Automod', color: 0xff9f1c },
};

const FOOTER = 'casier:';

async function getChannel(client) {
  const channelId = process.env.SANCTIONS_CHANNEL_ID;
  return channelId ? client.channels.fetch(channelId) : null;
}

export async function record(client, { type, user, moderator, reason, duration }) {
  const channel = await getChannel(client);
  if (!channel) return null;

  const embed = new EmbedBuilder()
    .setColor(TYPES[type].color)
    .setTitle(TYPES[type].label)
    .setThumbnail(user.displayAvatarURL({ size: 128 }))
    .addFields(
      { name: 'Membre', value: `${user} (${escapeMarkdown(user.tag)})`, inline: true },
      { name: 'Par', value: moderator ? `${moderator}` : 'Automod', inline: true },
    )
    .setFooter({ text: `${FOOTER}${user.id}:${type}` })
    .setTimestamp();
  if (duration) embed.addFields({ name: 'Durée', value: duration, inline: true });
  embed.addFields({ name: 'Raison', value: reason || '*Aucune raison donnée*' });

  return channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
}

// Sanctions d'un membre, de la plus récente à la plus ancienne (500 derniers messages du salon)
export async function history(client, userId) {
  const channel = await getChannel(client);
  if (!channel) return [];

  const found = [];
  let before;
  for (let page = 0; page < 5; page++) {
    const messages = await channel.messages.fetch({ limit: 100, before });
    if (!messages.size) break;
    for (const message of messages.values()) {
      const footer = message.embeds[0]?.footer?.text ?? '';
      if (message.author.id === client.user.id && footer.startsWith(`${FOOTER}${userId}:`)) {
        found.push({ message, type: footer.split(':')[2] });
      }
    }
    before = messages.last().id;
  }
  return found;
}

export async function countWarns(client, userId) {
  return (await history(client, userId)).filter((s) => s.type === 'warn').length;
}

// Retire le dernier avertissement (supprime son message du casier)
export async function removeLastWarn(client, userId) {
  const last = (await history(client, userId)).find((s) => s.type === 'warn');
  if (!last) return null;
  await last.message.delete();
  return last;
}
