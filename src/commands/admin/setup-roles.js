import { ChannelType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { ensureRoles, giveLiveNotifToEveryone, rolesPanel } from '../../features/selfRoles.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup-roles')
    .setDescription('Crée les rôles à choisir et poste le panneau de boutons')
    .addChannelOption((o) =>
      o.setName('salon').setDescription('Salon où poster le panneau (par défaut : ici)').addChannelTypes(ChannelType.GuildText),
    )
    .addBooleanOption((o) =>
      o.setName('notifs-live-a-tous').setDescription('Donner 🔔 Notifs live à tous les membres actuels (transition depuis @everyone)'),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(0),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const channel = interaction.options.getChannel('salon') ?? interaction.channel;

    const created = await ensureRoles(interaction.guild);
    await channel.send(rolesPanel());
    const given = interaction.options.getBoolean('notifs-live-a-tous') ? await giveLiveNotifToEveryone(interaction.guild) : null;

    await interaction.editReply(
      [
        `✅ Panneau posté dans ${channel}`,
        created.length ? `🆕 Rôles créés : ${created.map((r) => `${r}`).join(', ')}` : '✔️ Tous les rôles existaient déjà',
        given !== null ? `🔔 Notifs live données à ${given} membre(s)` : null,
      ].filter(Boolean).join('\n'),
    );
  },
};
