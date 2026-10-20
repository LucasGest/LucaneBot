import { AttachmentBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { renderWelcomeImage, sendWelcome } from '../../features/welcome.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test-bienvenue')
    .setDescription('Aperçu du message de bienvenue')
    .addUserOption((o) => o.setName('membre').setDescription('Membre à utiliser (par défaut : toi)'))
    .addBooleanOption((o) => o.setName('public').setDescription('Poster le vrai message de bienvenue, visible par tous (par défaut : non)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(0),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const member = interaction.options.getMember('membre') ?? interaction.member;

    if (interaction.options.getBoolean('public')) {
      const message = await sendWelcome(member, interaction.channel);
      return interaction.editReply(`✅ Message de bienvenue posté : ${message.url}`);
    }

    const image = new AttachmentBuilder(await renderWelcomeImage(member), { name: 'bienvenue.png' });
    await interaction.editReply({ files: [image] });
  },
};
