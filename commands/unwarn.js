const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isAdmin, sanitizeReason } = require('../utils/modUtils');
const { logAction } = require('../utils/modLogger');
const { removeWarn } = require('../utils/warnManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unwarn')
    .setDescription('Retirer un avertissement à un membre')
    .addUserOption(o => o.setName('membre').setDescription('Membre').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction, client) {
    if (!isAdmin(interaction.member))
      return interaction.reply({ content: '❌ Réservé aux admins.', flags: 64 });

    const target = interaction.options.getMember('membre');
    const reason = sanitizeReason(interaction.options.getString('raison'));

    if (!target) return interaction.reply({ content: '❌ Membre introuvable.', flags: 64 });

    const count = removeWarn(target.id);
    await logAction(client, { action: 'unwarn', target: target.user, moderator: interaction.user, reason, extra: `${count} warn(s) restant(s)` });
    await interaction.reply({ content: `✅ Un warn retiré à **${target.user.tag}**. Restant : **${count}**` });
  },
};