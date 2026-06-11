const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isAdmin, sanitizeReason, isValidSnowflake } = require('../utils/modUtils');
const { logAction } = require('../utils/modLogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Débannir un utilisateur')
    .addStringOption(o => o.setName('userid').setDescription('ID Discord de l\'utilisateur').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison du déban').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction, client) {
    if (!isAdmin(interaction.member))
      return interaction.reply({ content: '❌ Réservé aux admins.', flags: 64 });

    const userId = interaction.options.getString('userid').trim();
    const reason = sanitizeReason(interaction.options.getString('raison'));

    // Validation de l'ID pour éviter toute injection
    if (!isValidSnowflake(userId))
      return interaction.reply({ content: '❌ ID invalide. Un ID Discord contient 17 à 19 chiffres.', flags: 64 });

    try {
      const banList = await interaction.guild.bans.fetch();
      const banned = banList.get(userId);
      if (!banned) return interaction.reply({ content: '❌ Cet utilisateur n\'est pas banni.', flags: 64 });

      await interaction.guild.members.unban(userId, reason);
      await logAction(client, { action: 'unban', target: banned.user, moderator: interaction.user, reason });
      await interaction.reply({ content: `✅ **${banned.user.tag}** a été débanni.` });
    } catch {
      interaction.reply({ content: `❌ Impossible de débannir cet utilisateur.`, flags: 64 });
    }
  },
};