import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } from 'discord.js';
import { selfRoles } from '../config.js';
import { log } from '../utils/logger.js';

// Panneau de rôles à boutons : un clic ajoute le rôle, un second clic le retire.
// Les rôles sont retrouvés par leur nom (config.js), le bouton porte l'index du rôle dans la config.
export const BUTTON_PREFIX = 'role:';

const allRoles = selfRoles.groups.flatMap((group) => group.roles);

export function findRole(guild, name) {
  return guild.roles.cache.find((role) => role.name === name) ?? null;
}

// Crée les rôles manquants (sous le rôle du bot, donc gérables par lui)
export async function ensureRoles(guild) {
  await guild.roles.fetch();
  const created = [];
  for (const def of allRoles) {
    if (findRole(guild, def.name)) continue;
    created.push(await guild.roles.create({ name: def.name, mentionable: def.mentionable, reason: 'Rôle à choisir (panneau de rôles)' }));
  }
  return created;
}

export function rolesPanel() {
  const embed = new EmbedBuilder()
    .setColor(0x2ec5ff)
    .setTitle('🎭 CHOISIS TES RÔLES')
    .setDescription(
      'Clique sur un bouton pour **prendre** un rôle, reclique pour le **retirer**.\n\n'
      + selfRoles.groups
        .map((group) => `**${group.title}**\n${group.roles.map((r) => `${r.emoji} **${r.label}** · ${r.description}`).join('\n')}`)
        .join('\n\n'),
    )
    .setFooter({ text: 'Lucanebot · tu peux changer d\'avis quand tu veux' });

  let index = 0;
  const rows = selfRoles.groups.map((group, groupIndex) =>
    new ActionRowBuilder().addComponents(
      group.roles.map((r) =>
        new ButtonBuilder()
          .setCustomId(`${BUTTON_PREFIX}${index++}`)
          .setLabel(r.label)
          .setEmoji(r.emoji)
          .setStyle(groupIndex === 0 ? ButtonStyle.Primary : ButtonStyle.Secondary),
      ),
    ),
  );
  return { embeds: [embed], components: rows };
}

export async function handleRoleButton(interaction) {
  const def = allRoles[Number(interaction.customId.slice(BUTTON_PREFIX.length))];
  const role = def && findRole(interaction.guild, def.name);
  if (!role) {
    return interaction.reply({ content: 'Ce rôle n\'existe plus 😕 Préviens le staff !', flags: MessageFlags.Ephemeral });
  }

  const has = interaction.member.roles.cache.has(role.id);
  if (has) await interaction.member.roles.remove(role, 'Panneau de rôles');
  else await interaction.member.roles.add(role, 'Panneau de rôles');

  await interaction.reply({
    content: has ? `➖ Rôle ${role} retiré.` : `✅ Tu as maintenant le rôle ${role} !`,
    flags: MessageFlags.Ephemeral,
    allowedMentions: { parse: [] },
  });
}

// Transition depuis @everyone : donne le rôle Notifs live à tous les membres (hors bots)
export async function giveLiveNotifToEveryone(guild) {
  const role = findRole(guild, selfRoles.liveNotifName);
  if (!role) return 0;
  const members = await guild.members.fetch();
  let count = 0;
  for (const member of members.values()) {
    if (member.user.bot || member.roles.cache.has(role.id)) continue;
    await member.roles.add(role, 'Transition @everyone → Notifs live');
    count += 1;
  }
  await log(guild.client, { type: 'info', title: '🔔 Notifs live données à tous', description: `${count} membre(s) ont reçu ${role}` });
  return count;
}
