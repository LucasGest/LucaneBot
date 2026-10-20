import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { DAYS, editPlanning, formatDay } from '../../features/planning.js';

const dayOption = (option) =>
  option
    .setName('jour')
    .setDescription('Jour de la semaine')
    .setRequired(true)
    .addChoices(...DAYS.map((day) => ({ name: day, value: day })));

export default {
  data: new SlashCommandBuilder()
    .setName('planning-modifier')
    .setDescription('Modifie le planning des streams')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(0)
    .addSubcommand((sub) =>
      sub
        .setName('jour')
        .setDescription('Ajoute ou modifie un jour de stream')
        .addStringOption(dayOption)
        .addStringOption((o) => o.setName('horaire').setDescription('Ex : 20h – 23h').setRequired(true).setMaxLength(40))
        .addStringOption((o) => o.setName('programme').setDescription('Ex : Valorant ranked').setRequired(true).setMaxLength(200)),
    )
    .addSubcommand((sub) =>
      sub.setName('retirer').setDescription('Retire un jour du planning').addStringOption(dayOption),
    )
    .addSubcommand((sub) =>
      sub
        .setName('note')
        .setDescription('Texte affiché en haut du planning (vide = supprimer)')
        .addStringOption((o) => o.setName('texte').setDescription('Ex : Semaine spéciale Halloween 🎃').setMaxLength(1000)),
    )
    .addSubcommand((sub) => sub.setName('vider').setDescription('Efface tout le planning')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const day = interaction.options.getString('jour');

    const message = await editPlanning(interaction.client, (planning) => {
      if (sub === 'jour') {
        planning.days[day] = formatDay(interaction.options.getString('horaire'), interaction.options.getString('programme'));
      } else if (sub === 'retirer') {
        delete planning.days[day];
      } else if (sub === 'note') {
        planning.note = interaction.options.getString('texte') ?? '';
      } else if (sub === 'vider') {
        planning.days = {};
        planning.note = '';
      }
    });

    await interaction.reply({ content: `✅ Planning mis à jour : ${message.url}`, flags: MessageFlags.Ephemeral });
  },
};
