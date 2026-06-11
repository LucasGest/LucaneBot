const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isModerator, canTarget, sanitizeReason } = require('../utils/modUtils');
const { logAction } = require('../utils/modLogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulser un membre du serveur')
    .addUserOption(o => o.setName('membre').setDescription('Membre à kick').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison du kick').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction, client) {
    if (!isModerator(interaction.member))
      return interaction.reply({ content: '❌ Réservé aux modérateurs.', flags: 64 });

    const target = interaction.options.getMember('membre');
    const reason = sanitizeReason(interaction.options.getString('raison'));

    if (!target) return interaction.reply({ content: '❌ Membre introuvable.', flags: 64 });
    if (!canTarget(interaction.member, target))
      return interaction.reply({ content: '❌ Tu ne peux pas sanctionner ce membre (rang supérieur ou égal).', flags: 64 });

    try {
      await target.send(`👢 Tu as été **expulsé** du serveur **${interaction.guild.name}**.\nRaison : ${reason}`).catch(() => {});
      await target.kick(reason);

      await logAction(client, { action: 'kick', target: target.user, moderator: interaction.user, reason });
      await interaction.reply({ content: `✅ **${target.user.tag}** a été expulsé. Raison : ${reason}` });
    } catch {
      interaction.reply({ content: `❌ Impossible de kick ce membre.`, flags: 64 });
    }
  },
};