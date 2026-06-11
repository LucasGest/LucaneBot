const { EmbedBuilder } = require('discord.js');
const { addXP } = require('../utils/xpManager');
const { containsForbiddenLink, isSpamming, handleViolation } = require('../utils/automod');

const XP_COOLDOWN = 60_000;
const XP_PER_MESSAGE = 15;
const cooldowns = new Map();

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    // ─── AUTO-MODÉRATION ───────────────────────────────
    // Ignore les modérateurs
    if (!message.member.permissions.has('ManageMessages')) {

      // Anti-liens interdits
      if (containsForbiddenLink(message.content)) {
        return handleViolation(message, 'lien non autorisé');
      }

      // Anti-spam
      if (isSpamming(message.author.id)) {
        return handleViolation(message, 'spam détecté');
      }
    }

    // ─── SYSTÈME XP ────────────────────────────────────
    const userId = message.author.id;
    const now = Date.now();

    if (cooldowns.has(userId) && now - cooldowns.get(userId) < XP_COOLDOWN) return;
    cooldowns.set(userId, now);

    const { user, leveledUp } = addXP(userId, XP_PER_MESSAGE);

    if (leveledUp) {
      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle('⬆️ Level Up !')
        .setDescription(`Félicitations ${message.author} ! Tu es maintenant **niveau ${user.level}** ! 🎉`)
        .setThumbnail(message.author.displayAvatarURL())
        .setTimestamp();

      message.channel.send({ embeds: [embed] });
    }
  },
};