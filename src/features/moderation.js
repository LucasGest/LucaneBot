import { EmbedBuilder, MessageFlags } from 'discord.js';

export const DURATIONS = [
  { name: '60 secondes', value: '1' },
  { name: '5 minutes', value: '5' },
  { name: '10 minutes', value: '10' },
  { name: '1 heure', value: '60' },
  { name: '6 heures', value: '360' },
  { name: '1 jour', value: '1440' },
  { name: '1 semaine', value: '10080' },
];

export const durationLabel = (minutes) => DURATIONS.find((d) => d.value === String(minutes))?.name ?? `${minutes} min`;

// Vérifie qu'un modo a le droit de sanctionner ce membre. Renvoie un message d'erreur, ou null si c'est bon.
// check : 'moderatable' | 'kickable' | 'bannable' (ce que le bot, lui, doit pouvoir faire)
export function cannotSanction(interaction, target, check) {
  if (!target) return 'Ce membre n\'est pas sur le serveur.';
  if (target.id === interaction.user.id) return 'Tu ne peux pas te sanctionner toi-même 😅';
  if (target.id === interaction.guild.ownerId) return 'Impossible de sanctionner le propriétaire du serveur.';
  if (target.user.bot) return 'Impossible de sanctionner un bot.';

  const isOwner = interaction.user.id === interaction.guild.ownerId;
  if (!isOwner && target.roles.highest.position >= interaction.member.roles.highest.position) {
    return 'Ce membre a un rôle égal ou supérieur au tien.';
  }
  if (check && !target[check]) return 'Mon rôle est trop bas pour sanctionner ce membre (place Lucanebot plus haut).';
  return null;
}

export const fail = (interaction, content) => interaction.reply({ content: `❌ ${content}`, flags: MessageFlags.Ephemeral });

// Prévient le membre en MP (silencieux si ses MP sont fermés)
export async function notify(user, guild, { title, reason, duration }) {
  const embed = new EmbedBuilder()
    .setColor(0xff9f1c)
    .setTitle(title)
    .setDescription(`Sur le serveur **${guild.name}**`)
    .addFields({ name: 'Raison', value: reason || '*Aucune raison donnée*' })
    .setTimestamp();
  if (duration) embed.addFields({ name: 'Durée', value: duration });
  return user.send({ embeds: [embed] }).then(() => true).catch(() => false);
}

export const auditReason = (moderator, reason) => `${moderator.tag} : ${reason || 'aucune raison'}`.slice(0, 512);
