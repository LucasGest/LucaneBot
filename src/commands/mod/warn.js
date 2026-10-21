import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { moderation } from '../../config.js';
import { countWarns, record } from '../../features/casier.js';
import { auditReason, cannotSanction, durationLabel, fail, notify } from '../../features/moderation.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Avertit un membre (enregistré dans son casier)')
    .addUserOption((o) => o.setName('membre').setDescription('Membre à avertir').setRequired(true))
    .addStringOption((o) => o.setName('raison').setDescription('Raison de l\'avertissement').setRequired(true).setMaxLength(500))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setContexts(0),

  async execute(interaction) {
    const target = interaction.options.getMember('membre');
    const reason = interaction.options.getString('raison');
    const error = cannotSanction(interaction, target);
    if (error) return fail(interaction, error);

    await record(interaction.client, { type: 'warn', user: target.user, moderator: interaction.user, reason });
    const warns = await countWarns(interaction.client, target.id);
    const dm = await notify(target.user, interaction.guild, { title: '⚠️ Tu as reçu un avertissement', reason });

    // Trop d'avertissements : exclusion temporaire automatique
    let extra = '';
    const { autoTimeoutAfterWarns, autoTimeoutMinutes } = moderation;
    if (warns >= autoTimeoutAfterWarns && warns % autoTimeoutAfterWarns === 0 && target.moderatable) {
      const autoReason = `${warns} avertissements`;
      await target.timeout(autoTimeoutMinutes * 60_000, auditReason(interaction.user, autoReason));
      await record(interaction.client, { type: 'timeout', user: target.user, moderator: interaction.client.user, reason: autoReason, duration: durationLabel(autoTimeoutMinutes) });
      extra = `\n⏳ ${warns} avertissements : exclu automatiquement ${durationLabel(autoTimeoutMinutes)}.`;
    }

    await interaction.reply({
      content: `⚠️ ${target} a été averti (${warns} avertissement${warns > 1 ? 's' : ''}).${dm ? '' : ' *(MP fermés, non prévenu)*'}${extra}`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
