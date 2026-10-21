import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { record } from '../../features/casier.js';
import { auditReason, cannotSanction, fail } from '../../features/moderation.js';

export default {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Met fin à l\'exclusion temporaire d\'un membre')
    .addUserOption((o) => o.setName('membre').setDescription('Membre concerné').setRequired(true))
    .addStringOption((o) => o.setName('raison').setDescription('Raison').setMaxLength(500))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setContexts(0),

  async execute(interaction) {
    const target = interaction.options.getMember('membre');
    const reason = interaction.options.getString('raison');
    const error = cannotSanction(interaction, target, 'moderatable');
    if (error) return fail(interaction, error);
    if (!target.isCommunicationDisabled()) return fail(interaction, `${target} n'est pas exclu.`);

    await target.timeout(null, auditReason(interaction.user, reason));
    await record(interaction.client, { type: 'untimeout', user: target.user, moderator: interaction.user, reason });
    await interaction.reply({ content: `✅ L'exclusion de ${target} est levée.`, flags: MessageFlags.Ephemeral });
  },
};
