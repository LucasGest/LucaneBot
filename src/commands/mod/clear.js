import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { log } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Supprime des messages récents dans ce salon')
    .addIntegerOption((o) => o.setName('nombre').setDescription('Nombre de messages à parcourir (1 à 100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption((o) => o.setName('membre').setDescription('Ne supprimer que les messages de ce membre'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setContexts(0),

  async execute(interaction) {
    const amount = interaction.options.getInteger('nombre');
    const user = interaction.options.getUser('membre');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const messages = await interaction.channel.messages.fetch({ limit: amount });
    const targets = user ? messages.filter((m) => m.author.id === user.id) : messages;
    // Discord refuse la suppression groupée des messages de plus de 14 jours : ils sont ignorés
    const deleted = await interaction.channel.bulkDelete(targets, true);

    await log(interaction.client, {
      type: 'warn',
      title: '🧹 Messages supprimés',
      description: `**${deleted.size}** message(s) dans ${interaction.channel}${user ? ` de ${user}` : ''}\n**Par** : ${interaction.user}`,
    });
    const skipped = targets.size - deleted.size;
    await interaction.editReply(`🧹 ${deleted.size} message(s) supprimé(s).${skipped ? ` ${skipped} trop ancien(s) (plus de 14 jours) ignoré(s).` : ''}`);
  },
};
