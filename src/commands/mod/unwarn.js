import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { countWarns, removeLastWarn } from '../../features/casier.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unwarn')
    .setDescription('Retire le dernier avertissement d\'un membre')
    .addUserOption((o) => o.setName('membre').setDescription('Membre concerné').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setContexts(0),

  async execute(interaction) {
    const user = interaction.options.getUser('membre');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const removed = await removeLastWarn(interaction.client, user.id);
    if (!removed) return interaction.editReply(`${user} n'a aucun avertissement.`);

    const left = await countWarns(interaction.client, user.id);
    await interaction.editReply(`✅ Dernier avertissement de ${user} retiré (il en reste ${left}).`);
  },
};
