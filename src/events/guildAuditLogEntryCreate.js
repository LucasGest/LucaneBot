import { AuditLogEvent, Events, Role } from 'discord.js';
import { serverLogs } from '../config.js';
import { log } from '../utils/logger.js';
import { permissionDiff, permissionNames } from '../utils/permissionNames.js';

// Journal des modifications du serveur (rôles, salons, permissions, réglages, sanctions) dans #bot-log.
// Discord fournit l'auteur de chaque action via le journal d'audit (permission « Voir les logs du serveur »).
// Les actions du bot lui-même (compteurs, rôles à choisir…) sont ignorées : elles ont déjà leurs propres logs.

const ACTIONS = {
  [AuditLogEvent.GuildUpdate]: ['warn', '⚙️ Serveur modifié'],
  [AuditLogEvent.RoleCreate]: ['info', '🎭 Rôle créé'],
  [AuditLogEvent.RoleUpdate]: ['warn', '🎭 Rôle modifié'],
  [AuditLogEvent.RoleDelete]: ['error', '🎭 Rôle supprimé'],
  [AuditLogEvent.ChannelCreate]: ['info', '📁 Salon créé'],
  [AuditLogEvent.ChannelUpdate]: ['info', '📁 Salon modifié'],
  [AuditLogEvent.ChannelDelete]: ['error', '📁 Salon supprimé'],
  [AuditLogEvent.ChannelOverwriteCreate]: ['warn', '🔐 Permissions de salon ajoutées'],
  [AuditLogEvent.ChannelOverwriteUpdate]: ['warn', '🔐 Permissions de salon modifiées'],
  [AuditLogEvent.ChannelOverwriteDelete]: ['warn', '🔐 Permissions de salon retirées'],
  [AuditLogEvent.MemberRoleUpdate]: ['info', '👤 Rôles d\'un membre modifiés'],
  [AuditLogEvent.MemberUpdate]: ['info', '👤 Membre modifié'],
  [AuditLogEvent.MemberKick]: ['error', '👢 Membre expulsé'],
  [AuditLogEvent.MemberBanAdd]: ['error', '🔨 Membre banni'],
  [AuditLogEvent.MemberBanRemove]: ['success', '🔓 Membre débanni'],
  [AuditLogEvent.BotAdd]: ['warn', '🤖 Bot ajouté'],
  [AuditLogEvent.WebhookCreate]: ['warn', '🪝 Webhook créé'],
  [AuditLogEvent.WebhookDelete]: ['warn', '🪝 Webhook supprimé'],
  [AuditLogEvent.InviteCreate]: ['info', '✉️ Invitation créée'],
  [AuditLogEvent.AutoModerationRuleUpdate]: ['warn', '🛡️ Règle AutoMod modifiée'],
};

const KEYS = {
  name: 'Nom',
  color: 'Couleur',
  hoist: 'Affiché séparément',
  mentionable: 'Mentionnable',
  topic: 'Sujet',
  nsfw: 'NSFW',
  rate_limit_per_user: 'Mode lent (s)',
  verification_level: 'Niveau de vérification',
  explicit_content_filter: 'Filtre de contenu',
  mfa_level: '2FA pour la modération',
  default_message_notifications: 'Notifications par défaut',
  icon_hash: 'Icône',
  banner_hash: 'Bannière',
  nick: 'Pseudo',
  communication_disabled_until: 'Exclu jusqu\'à',
  bitrate: 'Débit audio',
  user_limit: 'Limite d\'utilisateurs',
  parent_id: 'Catégorie',
  position: 'Position',
};

const VERIFICATION = ['Aucun', 'Faible', 'Moyen', 'Élevé', 'Très élevé'];

function formatValue(key, value) {
  if (value === undefined || value === null || value === '') return '*(vide)*';
  if (typeof value === 'boolean') return value ? 'oui' : 'non';
  if (key === 'color') return `#${Number(value).toString(16).padStart(6, '0')}`;
  if (key === 'verification_level') return VERIFICATION[value] ?? String(value);
  if (key === 'parent_id') return `<#${value}>`;
  if (key === 'communication_disabled_until') return `<t:${Math.floor(Date.parse(value) / 1000)}:f>`;
  return String(value).slice(0, 200);
}

function describeTarget(entry, guild) {
  const id = entry.targetId;
  if (!id) return null;
  switch (entry.targetType) {
    case 'Role': return `<@&${id}>`;
    case 'Channel': return `<#${id}>`;
    case 'User': return `<@${id}>`;
    case 'Guild': return `**${guild.name}**`;
    default: return null;
  }
}

const CREATE_OR_DELETE = new Set([
  AuditLogEvent.RoleCreate, AuditLogEvent.RoleDelete, AuditLogEvent.ChannelCreate, AuditLogEvent.ChannelDelete,
]);

// Actions de salon faites par des bots « de routine » (vocaux temporaires d'EmpyManager…) : trop fréquentes
const CHANNEL_ACTIONS = new Set([
  AuditLogEvent.ChannelCreate, AuditLogEvent.ChannelUpdate, AuditLogEvent.ChannelDelete,
  AuditLogEvent.ChannelOverwriteCreate, AuditLogEvent.ChannelOverwriteUpdate, AuditLogEvent.ChannelOverwriteDelete,
]);

function describeChanges(entry) {
  // Création / suppression : le nom suffit
  if (CREATE_OR_DELETE.has(entry.action)) {
    const name = entry.changes.find((c) => c.key === 'name');
    const value = name?.new ?? name?.old;
    const perms = entry.changes.find((c) => c.key === 'permissions')?.new;
    return [value && `**Nom** : ${value}`, perms !== undefined && permissionNames(perms).length && `**Permissions** : ${permissionNames(perms).join(', ')}`].filter(Boolean);
  }

  const lines = [];
  const other = [];
  for (const { key, old: before, new: after } of entry.changes) {
    if (key === 'permissions' || key === 'allow' || key === 'deny') {
      const label = key === 'allow' ? 'Autorisées' : key === 'deny' ? 'Refusées' : 'Permissions';
      // Création : pas d'ancienne valeur, on liste simplement les permissions
      if (before === undefined) {
        const names = permissionNames(after);
        if (names.length) lines.push(`**${label}** : ${names.join(', ')}`);
        continue;
      }
      const { added, removed } = permissionDiff(before, after);
      if (added.length) lines.push(`✅ **${label} ajoutées** : ${added.join(', ')}`);
      if (removed.length) lines.push(`❌ **${label} retirées** : ${removed.join(', ')}`);
    } else if (key === '$add' || key === '$remove') {
      const roles = (after ?? []).map((r) => `<@&${r.id}>`).join(', ');
      lines.push(`${key === '$add' ? '➕ Rôle(s) donné(s)' : '➖ Rôle(s) retiré(s)'} : ${roles}`);
    } else if (key === 'icon_hash' || key === 'banner_hash' || key === 'splash_hash') {
      lines.push(`🖼️ **${KEYS[key] ?? 'Image'}** : ${after ? 'nouvelle image' : 'supprimée'}`);
    } else if (KEYS[key]) {
      lines.push(`**${KEYS[key]}** : ${formatValue(key, before)} → ${formatValue(key, after)}`);
    } else {
      other.push(key);
    }
  }
  if (other.length) lines.push(`**Autres réglages** : ${other.join(', ')}`);
  return lines;
}

export default {
  name: Events.GuildAuditLogEntryCreate,

  async execute(entry, guild) {
    if (entry.executorId === guild.client.user.id) return;
    const action = ACTIONS[entry.action];
    if (!action) return;
    if (CHANNEL_ACTIONS.has(entry.action) && serverLogs.quietBotIds.includes(entry.executorId)) return;

    // Le déplacement des rôles/salons génère des dizaines d'entrées « Position » : on les ignore
    if (entry.changes.length && entry.changes.every((c) => c.key === 'position')) return;

    const [type, title] = action;
    const target = describeTarget(entry, guild);
    // Permissions de salon : rôle ou membre concerné (objet Role/GuildMember, ou { id, type } s'il n'est pas en cache)
    const extra = entry.extra;
    const isRole = extra instanceof Role || String(extra?.type) === '0';
    const overwriteFor = extra?.id ? (isRole ? `<@&${extra.id}>` : `<@${extra.id}>`) : null;
    const changes = describeChanges(entry);

    await log(guild.client, {
      type,
      title,
      description: [
        target && `**Cible** : ${target}`,
        overwriteFor && `**Pour** : ${overwriteFor}`,
        `**Par** : <@${entry.executorId}>`,
        entry.reason && `**Raison** : ${entry.reason}`,
        changes.length ? `\n${changes.join('\n')}` : null,
      ].filter(Boolean).join('\n'),
    });
  },
};
