import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { setupCounters } from '../../features/counters.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup-compteurs')
    .setDescription('Crée les salons vocaux compteurs (membres, followers Twitch)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(0),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const created = await setupCounters(interaction.guild);
    await interaction.editReply(
      created.length
        ? `✅ Compteurs créés : ${created.map((c) => `${c}`).join(', ')}\nDéplace-les où tu veux, ils seront retrouvés automatiquement.`
        : '✅ Les compteurs existent déjà, je les ai mis à jour.',
    );
  },
};
