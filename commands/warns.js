const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isAdmin } = require('../utils/modUtils');
const { getWarnCount } = require('../utils/warnManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warns')
    .setDescription('Voir les avertissements d\'un membre')
    .addUserOption(o => o.setName('membre').setDescription('Membre').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    if (!isAdmin(interaction.member))
      return interaction.reply({ content: '❌ Réservé aux admins.', flags: 64 });

    const target = interaction.options.getMember('membre');
    if (!target) return interaction.reply({ content: '❌ Membre introuvable.', flags: 64 });

    const count = getWarnCount(target.id);

    const embed = new EmbedBuilder()
      .setColor(count === 0 ? 0x00ff00 : count < 3 ? 0xffaa00 : 0xff0000)
      .setTitle(`⚠️ Avertissements de ${target.user.username}`)
      .setThumbnail(target.user.displayAvatarURL())
      .addFields({ name: 'Total warns', value: `**${count}** / 6` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};