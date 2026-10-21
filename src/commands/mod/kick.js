import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { record } from '../../features/casier.js';
import { auditReason, cannotSanction, fail, notify } from '../../features/moderation.js';

export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulse un membre (il peut revenir avec une invitation)')
    .addUserOption((o) => o.setName('membre').setDescription('Membre à expulser').setRequired(true))
    .addStringOption((o) => o.setName('raison').setDescription('Raison').setMaxLength(500))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setContexts(0),

  async execute(interaction) {
    const target = interaction.options.getMember('membre');
    const reason = interaction.options.getString('raison');
    const error = cannotSanction(interaction, target, 'kickable');
    if (error) return fail(interaction, error);

    // Le MP part avant l'expulsion : après, le bot ne partage plus de serveur avec lui
    const dm = await notify(target.user, interaction.guild, { title: '👢 Tu as été expulsé', reason });
    await target.kick(auditReason(interaction.user, reason));
    await record(interaction.client, { type: 'kick', user: target.user, moderator: interaction.user, reason });

    await interaction.reply({ content: `👢 ${target.user.tag} a été expulsé.${dm ? '' : ' *(MP fermés, non prévenu)*'}`, flags: MessageFlags.Ephemeral });
  },
};
