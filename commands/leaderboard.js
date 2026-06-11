const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('../utils/xpManager');

const MEDALS = ['🥇', '🥈', '🥉'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Voir le classement XP du serveur'),

  async execute(interaction) {
    await interaction.deferReply();

    const top = getLeaderboard();
    const lines = await Promise.all(
      top.map(async (entry, i) => {
        const medal = MEDALS[i] || `**${i + 1}.**`;
        let name = `Utilisateur inconnu`;
        try {
          const user = await interaction.client.users.fetch(entry.id);
          name = user.username;
        } catch {}
        return `${medal} **${name}** — Niveau ${entry.level} (${entry.xp} XP)`;
      })
    );

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('🏆 Classement XP')
      .setDescription(lines.join('\n') || 'Aucune donnée pour l\'instant.')
      .setFooter({ text: 'Chatte pour gagner de l\'XP !' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
