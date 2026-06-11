const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isAdmin, canTarget, sanitizeReason } = require('../utils/modUtils');
const { logAction } = require('../utils/modLogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannir un membre du serveur')
    .addUserOption(o => o.setName('membre').setDescription('Membre à bannir').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison du ban').setRequired(false))
    .addIntegerOption(o => o.setName('jours').setDescription('Supprimer les messages des X derniers jours (0-7)').setMinValue(0).setMaxValue(7).setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction, client) {
    if (!isAdmin(interaction.member))
      return interaction.reply({ content: '❌ Réservé aux admins.', flags: 64 });

    const target = interaction.options.getMember('membre');
    const reason = sanitizeReason(interaction.options.getString('raison'));
    const days = interaction.options.getInteger('jours') ?? 0;

    if (!target) return interaction.reply({ content: '❌ Membre introuvable.', flags: 64 });
    if (!canTarget(interaction.member, target))
      return interaction.reply({ content: '❌ Tu ne peux pas sanctionner ce membre (rang supérieur ou égal).', flags: 64 });

    try {
      await target.send(`🔨 Tu as été **banni** du serveur **${interaction.guild.name}**.\nRaison : ${reason}`).catch(() => {});
      await target.ban({ deleteMessageSeconds: days * 86400, reason });

      await logAction(client, { action: 'ban', target: target.user, moderator: interaction.user, reason });
      await interaction.reply({ content: `✅ **${target.user.tag}** a été banni. Raison : ${reason}` });
    } catch {
      interaction.reply({ content: `❌ Impossible de bannir ce membre.`, flags: 64 });
    }
  },
};