import { EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder, escapeMarkdown, time, TimestampStyles } from 'discord.js';
import { TYPES, history } from '../../features/casier.js';

export default {
  data: new SlashCommandBuilder()
    .setName('sanctions')
    .setDescription('Affiche le casier d\'un membre')
    .addUserOption((o) => o.setName('membre').setDescription('Membre concerné').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setContexts(0),

  async execute(interaction) {
    const user = interaction.options.getUser('membre');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const list = await history(interaction.client, user.id);
    const counts = Object.entries(
      list.reduce((acc, s) => ({ ...acc, [s.type]: (acc[s.type] ?? 0) + 1 }), {}),
    ).map(([type, n]) => `${TYPES[type]?.label ?? type} × ${n}`);

    const lines = list.slice(0, 15).map(({ message, type }) => {
      const reason = message.embeds[0].fields.find((f) => f.name === 'Raison')?.value ?? '';
      return `${TYPES[type]?.label ?? type} · ${time(message.createdAt, TimestampStyles.ShortDate)} · [voir](${message.url})\n> ${reason.slice(0, 120)}`;
    });

    const embed = new EmbedBuilder()
      .setColor(list.length ? 0xff9f1c : 0x3ddc84)
      .setTitle(`📋 Casier de ${escapeMarkdown(user.tag)}`)
      .setThumbnail(user.displayAvatarURL({ size: 128 }))
      .setDescription(list.length ? `${counts.join(' · ')}\n\n${lines.join('\n')}` : '✨ Casier vierge, aucune sanction.')
      .setFooter({ text: list.length > 15 ? `15 plus récentes sur ${list.length}` : `${list.length} sanction(s)` });
    await interaction.editReply({ embeds: [embed] });
  },
};
