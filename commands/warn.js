const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isAdmin, canTarget, sanitizeReason } = require('../utils/modUtils');
const { logAction } = require('../utils/modLogger');
const { addWarn } = require('../utils/warnManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Avertir un membre')
    .addUserOption(o => o.setName('membre').setDescription('Membre à avertir').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction, client) {
    if (!isAdmin(interaction.member))
      return interaction.reply({ content: '❌ Réservé aux admins.', flags: 64 });

    const target = interaction.options.getMember('membre');
    const reason = sanitizeReason(interaction.options.getString('raison'));

    if (!target) return interaction.reply({ content: '❌ Membre introuvable.', flags: 64 });
    if (!canTarget(interaction.member, target))
      return interaction.reply({ content: '❌ Tu ne peux pas sanctionner ce membre.', flags: 64 });

    const count = addWarn(target.id);
    await logAction(client, { action: 'warn', target: target.user, moderator: interaction.user, reason, extra: `${count} warn(s) au total` });
    await target.send(`⚠️ Tu as reçu un **avertissement** sur **${interaction.guild.name}**.\nRaison : ${reason}\nTotal : **${count} warn(s)**`).catch(() => {});
    await interaction.reply({ content: `✅ **${target.user.tag}** averti. Total : **${count} warn(s)**. Raison : ${reason}` });
  },
};