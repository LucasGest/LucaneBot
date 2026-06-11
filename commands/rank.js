const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser } = require('../utils/xpManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Voir ton niveau et ton XP')
    .addUserOption(opt =>
      opt.setName('membre').setDescription('Voir le rang d\'un autre membre').setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('membre') || interaction.user;
    const userData = getUser(target.id);

    const xpNeeded = userData.level * 100;
    const progress = Math.round((userData.xp / xpNeeded) * 20);
    const bar = '█'.repeat(progress) + '░'.repeat(20 - progress);

    const embed = new EmbedBuilder()
      .setColor(0x9146ff)
      .setTitle(`📊 Rang de ${target.username}`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '⭐ Niveau', value: `**${userData.level}**`, inline: true },
        { name: '✨ XP', value: `**${userData.xp} / ${xpNeeded}**`, inline: true },
        { name: '\u200B', value: '\u200B', inline: true },
        { name: '📈 Progression', value: `\`${bar}\` ${Math.round((userData.xp / xpNeeded) * 100)}%` }
      )
      .setFooter({ text: 'Chaque message = +15 XP (1 fois/minute)' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
