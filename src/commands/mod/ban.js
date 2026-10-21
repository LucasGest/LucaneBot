import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { record } from '../../features/casier.js';
import { auditReason, cannotSanction, fail, notify } from '../../features/moderation.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannit un utilisateur (même s\'il n\'est plus sur le serveur)')
    .addUserOption((o) => o.setName('utilisateur').setDescription('Utilisateur à bannir').setRequired(true))
    .addStringOption((o) => o.setName('raison').setDescription('Raison').setMaxLength(500))
    .addStringOption((o) =>
      o
        .setName('supprimer-messages')
        .setDescription('Supprimer ses messages récents')
        .addChoices(
          { name: 'Ne rien supprimer', value: '0' },
          { name: 'Dernière heure', value: '3600' },
          { name: 'Dernières 24 h', value: '86400' },
          { name: '7 derniers jours', value: '604800' },
        ),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setContexts(0),

  async execute(interaction) {
    const user = interaction.options.getUser('utilisateur');
    const member = interaction.options.getMember('utilisateur');
    const reason = interaction.options.getString('raison');
    const deleteMessageSeconds = Number(interaction.options.getString('supprimer-messages') ?? 0);

    // Membre présent : mêmes garde-fous que les autres sanctions. Absent : on peut quand même le bannir.
    if (member) {
      const error = cannotSanction(interaction, member, 'bannable');
      if (error) return fail(interaction, error);
    } else if (user.id === interaction.user.id || user.bot) {
      return fail(interaction, 'Impossible de bannir cet utilisateur.');
    }

    const dm = member ? await notify(user, interaction.guild, { title: '🔨 Tu as été banni', reason }) : false;
    await interaction.guild.members.ban(user, { reason: auditReason(interaction.user, reason), deleteMessageSeconds });
    await record(interaction.client, { type: 'ban', user, moderator: interaction.user, reason });

    await interaction.reply({ content: `🔨 ${user.tag} a été banni.${member && !dm ? ' *(MP fermés, non prévenu)*' : ''}`, flags: MessageFlags.Ephemeral });
  },
};
