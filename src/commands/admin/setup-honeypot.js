import { ChannelType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { setupHoneypot } from '../../security/honeypot.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup-honeypot')
    .setDescription('Transforme un salon en piège anti-bots (tout message = sanction)')
    .addChannelOption((option) =>
      option
        .setName('salon')
        .setDescription('Salon piège (par défaut : ici)')
        .addChannelTypes(ChannelType.GuildText),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(0),

  async execute(interaction) {
    const channel = interaction.options.getChannel('salon') ?? interaction.channel;
    await setupHoneypot(channel);
    const permanent = process.env.HONEYPOT_CHANNEL_ID === channel.id;
    await interaction.reply({
      content: `🍯 ${channel} est maintenant un salon piège.`
        + (permanent ? '' : `\n⚠️ Pour que ce soit permanent, mets \`HONEYPOT_CHANNEL_ID=${channel.id}\` dans les variables d'environnement.`),
      flags: MessageFlags.Ephemeral,
    });
  },
};
