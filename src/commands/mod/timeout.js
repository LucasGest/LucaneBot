import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { record } from '../../features/casier.js';
import { DURATIONS, auditReason, cannotSanction, durationLabel, fail, notify } from '../../features/moderation.js';

export default {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Exclut temporairement un membre (il ne peut plus écrire ni parler)')
    .addUserOption((o) => o.setName('membre').setDescription('Membre à exclure').setRequired(true))
    .addStringOption((o) => o.setName('durée').setDescription('Durée de l\'exclusion').setRequired(true).addChoices(...DURATIONS))
    .addStringOption((o) => o.setName('raison').setDescription('Raison').setMaxLength(500))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setContexts(0),

  async execute(interaction) {
    const target = interaction.options.getMember('membre');
    const minutes = Number(interaction.options.getString('durée'));
    const reason = interaction.options.getString('raison');
    const error = cannotSanction(interaction, target, 'moderatable');
    if (error) return fail(interaction, error);

    const duration = durationLabel(minutes);
    await target.timeout(minutes * 60_000, auditReason(interaction.user, reason));
    await record(interaction.client, { type: 'timeout', user: target.user, moderator: interaction.user, reason, duration });
    const dm = await notify(target.user, interaction.guild, { title: '⏳ Tu as été exclu temporairement', reason, duration });

    await interaction.reply({ content: `⏳ ${target} est exclu pour **${duration}**.${dm ? '' : ' *(MP fermés, non prévenu)*'}`, flags: MessageFlags.Ephemeral });
  },
};
