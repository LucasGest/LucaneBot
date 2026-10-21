import { EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { checkConfig, formatReport } from '../../utils/configCheck.js';

export default {
  data: new SlashCommandBuilder()
    .setName('diagnostic')
    .setDescription('Vérifie la configuration du bot (variables d\'environnement, salons, rôles, Twitch)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(0),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const report = await checkConfig(interaction.client);
    const problems = report.missing.length + report.invalid.length;

    const embed = new EmbedBuilder()
      .setColor(problems ? 0xff9f1c : 0x3ddc84)
      .setTitle(problems ? '🟠 Configuration incomplète' : '🟢 Configuration complète')
      .setDescription(formatReport(report))
      .addFields(
        { name: 'Ping Discord', value: `${interaction.client.ws.ping} ms`, inline: true },
        { name: 'En ligne depuis', value: `<t:${Math.floor((Date.now() - interaction.client.uptime) / 1000)}:R>`, inline: true },
      )
      .setFooter({ text: problems ? 'Ajoute les variables manquantes dans Render → Environment' : 'Tout est en ordre 👌' });
    await interaction.editReply({ embeds: [embed] });
  },
};
