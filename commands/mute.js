const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isAdmin, canTarget, sanitizeReason, parseDuration, formatDuration } = require('../utils/modUtils');
const { logAction } = require('../utils/modLogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Muter un membre')
    .addUserOption(o => o.setName('membre').setDescription('Membre à muter').setRequired(true))
    .addStringOption(o => o.setName('duree').setDescription('Durée ex: 10m, 1h, 2d').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, client) {
    if (!isAdmin(interaction.member))
      return interaction.reply({ content: '❌ Réservé aux admins.', flags: 64 });

    const target = interaction.options.getMember('membre');
    const dureeStr = interaction.options.getString('duree');
    const reason = sanitizeReason(interaction.options.getString('raison'));

    if (!target) return interaction.reply({ content: '❌ Membre introuvable.', flags: 64 });
    if (!canTarget(interaction.member, target))
      return interaction.reply({ content: '❌ Tu ne peux pas sanctionner ce membre (rang supérieur ou égal).', flags: 64 });

    const ms = parseDuration(dureeStr);
    if (!ms) return interaction.reply({ content: '❌ Durée invalide. Exemples : `10m`, `1h`, `2d`', flags: 64 });
    if (ms > 28 * 24 * 3600 * 1000)
      return interaction.reply({ content: '❌ Durée max : 28 jours.', flags: 64 });

    try {
      await target.timeout(ms, reason);
      await logAction(client, { action: 'mute', target: target.user, moderator: interaction.user, reason, extra: formatDuration(ms) });
      await interaction.reply({ content: `✅ **${target.user.tag}** muté pendant **${formatDuration(ms)}**. Raison : ${reason}` });
    } catch {
      interaction.reply({ content: `❌ Impossible de muter ce membre.`, flags: 64 });
    }
  },
};