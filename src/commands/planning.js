import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { getPlanning, planningEmbed } from '../features/planning.js';

export default {
  data: new SlashCommandBuilder()
    .setName('planning')
    .setDescription('Affiche le planning des streams de Lucanemone'),

  async execute(interaction) {
    const planning = await getPlanning(interaction.client);
    await interaction.reply({ embeds: [planningEmbed(planning)], flags: MessageFlags.Ephemeral });
  },
};
