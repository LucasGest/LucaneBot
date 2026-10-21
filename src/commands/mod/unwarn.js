import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { countWarns, removeLastWarn } from '../../features/casier.js';
import { cannotSanction, fail } from '../../features/moderation.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unwarn')
    .setDescription('Retire le dernier avertissement d\'un membre')
    .addUserOption((o) => o.setName('membre').setDescription('Membre concerné').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setContexts(0),

  async execute(interaction) {
    const user = interaction.options.getUser('membre');
    const member = interaction.options.getMember('membre');

    // Mêmes garde-fous que /warn : pas soi-même, pas quelqu'un de rang égal ou supérieur
    if (user.id === interaction.user.id) return fail(interaction, 'Tu ne peux pas retirer tes propres avertissements.');
    if (member) {
      const error = cannotSanction(interaction, member);
      if (error) return fail(interaction, error);
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const removed = await removeLastWarn(interaction.client, user.id);
    if (!removed) return interaction.editReply(`${user} n'a aucun avertissement.`);

    const left = await countWarns(interaction.client, user.id);
    await interaction.editReply(`✅ Dernier avertissement de ${user} retiré (il en reste ${left}).`);
  },
};
