const { EmbedBuilder } = require('discord.js');

const COLORS = {
  ban:    0xff0000,
  unban:  0x00ff00,
  kick:   0xff6600,
  mute:   0xffaa00,
  unmute: 0x00ccff,
  warn:   0xffff00,
  unwarn: 0xaaffaa,
};

const ICONS = {
  ban:    '🔨',
  unban:  '✅',
  kick:   '👢',
  mute:   '🔇',
  unmute: '🔊',
  warn:   '⚠️',
  unwarn: '🗑️',
};

async function logAction(client, { action, target, moderator, reason, extra }) {
  const channel = client.channels.cache.get(process.env.MOD_LOG_CHANNEL_ID);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(COLORS[action] || 0x888888)
    .setTitle(`${ICONS[action]} ${action.toUpperCase()}`)
    .addFields(
      { name: '👤 Membre', value: `${target.tag || target} (${target.id || target})`, inline: true },
      { name: '🛡️ Modérateur', value: `${moderator.tag} (${moderator.id})`, inline: true },
      { name: '📝 Raison', value: reason || 'Aucune raison fournie', inline: false },
    )
    .setThumbnail(target.displayAvatarURL?.() || null)
    .setTimestamp();

  if (extra) embed.addFields({ name: '⏱️ Durée', value: extra, inline: true });

  channel.send({ embeds: [embed] });
}

module.exports = { logAction };