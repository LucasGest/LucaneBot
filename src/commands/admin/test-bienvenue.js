import { AttachmentBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { renderWelcomeImage } from '../../features/welcome.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test-bienvenue')
    .setDescription('Aperçu de l\'image de bienvenue (visible par toi seul)')
    .addUserOption((o) => o.setName('membre').setDescription('Membre à utiliser (par défaut : toi)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(0),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const member = interaction.options.getMember('membre') ?? interaction.member;
    const image = new AttachmentBuilder(await renderWelcomeImage(member), { name: 'bienvenue.png' });
    await interaction.editReply({ files: [image] });
  },
};
