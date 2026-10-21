import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { record } from '../../features/casier.js';
import { auditReason, fail } from '../../features/moderation.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Débannit un utilisateur')
    .addStringOption((o) => o.setName('id').setDescription('Identifiant de l\'utilisateur (clic droit > Copier l\'identifiant)').setRequired(true))
    .addStringOption((o) => o.setName('raison').setDescription('Raison').setMaxLength(500))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setContexts(0),

  async execute(interaction) {
    const id = interaction.options.getString('id').trim();
    const reason = interaction.options.getString('raison');

    const ban = await interaction.guild.bans.fetch(id).catch(() => null);
    if (!ban) return fail(interaction, 'Cet utilisateur n\'est pas banni (ou l\'identifiant est faux).');

    await interaction.guild.members.unban(id, auditReason(interaction.user, reason));
    await record(interaction.client, { type: 'unban', user: ban.user, moderator: interaction.user, reason });
    await interaction.reply({ content: `🔓 ${ban.user.tag} a été débanni.`, flags: MessageFlags.Ephemeral });
  },
};
