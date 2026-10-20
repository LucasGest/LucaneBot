import { EmbedBuilder } from 'discord.js';

const COLORS = {
  info: 0x2ec5ff,    // cyan néon
  success: 0x3ddc84,
  warn: 0xff9f1c,    // orange néon
  error: 0xff4d6d,
};

// Envoie un embed dans le salon de logs (sans jamais faire planter le bot)
export async function log(client, { type = 'info', title, description, fields = [] }) {
  try {
    const channel = await client.channels.fetch(process.env.LOG_CHANNEL_ID);
    if (!channel?.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setColor(COLORS[type])
      .setTitle(title)
      .setTimestamp();
    if (description) embed.setDescription(description.slice(0, 4000));
    if (fields.length) embed.addFields(fields);

    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error('❌ Impossible d\'écrire dans le salon de logs :', error.message);
  }
}
