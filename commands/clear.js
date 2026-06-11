const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isAdmin } = require('../utils/modUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Supprimer des messages en masse')
    .addIntegerOption(o => o.setName('nombre').setDescription('Nombre de messages à supprimer (1-100)').setMinValue(1).setMaxValue(100).setRequired(true))
    .addUserOption(o => o.setName('membre').setDescription('Supprimer uniquement les messages de ce membre').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    if (!isAdmin(interaction.member))
      return interaction.reply({ content: '❌ Réservé aux admins.', flags: 64 });

    const amount = interaction.options.getInteger('nombre');
    const target = interaction.options.getUser('membre');

    await interaction.deferReply({ flags: 64 });

    try {
      let messages = await interaction.channel.messages.fetch({ limit: 100 });

      // Filtre par membre si précisé
      if (target) messages = messages.filter(m => m.author.id === target.id);

      // Discord ne peut supprimer que les messages de moins de 14 jours en masse
      const toDelete = [...messages.values()]
        .filter(m => Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000)
        .slice(0, amount);

      await interaction.channel.bulkDelete(toDelete, true);

      await interaction.editReply({ content: `✅ **${toDelete.length}** message(s) supprimé(s).` });
    } catch (err) {
      await interaction.editReply({ content: `❌ Erreur lors de la suppression.` });
    }
  },
};