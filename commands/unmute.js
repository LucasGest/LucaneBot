const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isAdmin, canTarget, sanitizeReason } = require('../utils/modUtils');
const { logAction } = require('../utils/modLogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Retirer le mute d\'un membre')
    .addUserOption(o => o.setName('membre').setDescription('Membre à démuter').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, client) {
    if (!isAdmin(interaction.member))
      return interaction.reply({ content: '❌ Réservé aux admins.', flags: 64 });

    const target = interaction.options.getMember('membre');
    const reason = sanitizeReason(interaction.options.getString('raison'));

    if (!target) return interaction.reply({ content: '❌ Membre introuvable.', flags: 64 });
    if (!canTarget(interaction.member, target))
      return interaction.reply({ content: '❌ Tu ne peux pas modifier ce membre.', flags: 64 });

    try {
      await target.timeout(null, reason);
      await logAction(client, { action: 'unmute', target: target.user, moderator: interaction.user, reason });
      await interaction.reply({ content: `✅ **${target.user.tag}** n'est plus muté.` });
    } catch {
      interaction.reply({ content: `❌ Impossible de démuter ce membre.`, flags: 64 });
    }
  },
};