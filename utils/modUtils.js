// ─── PERMISSIONS ──────────────────────────────────────────────────────────────

function isAdmin(member) {
  return member.permissions.has('Administrator');
}

function isModerator(member) {
  return member.permissions.has('ManageMessages') || isAdmin(member);
}

// ─── HIÉRARCHIE ───────────────────────────────────────────────────────────────
// Empêche de sanctionner quelqu'un de rang supérieur ou égal

function canTarget(executor, target) {
  // Ne peut pas se sanctionner soi-même
  if (executor.id === target.id) return false;
  // Ne peut pas cibler le propriétaire du serveur
  if (target.id === target.guild.ownerId) return false;
  // Doit avoir un rôle plus haut dans la hiérarchie
  return executor.roles.highest.position > target.roles.highest.position;
}

// ─── SANITIZATION ─────────────────────────────────────────────────────────────

// Nettoie une raison : supprime les mentions et balises Discord potentiellement dangereuses
function sanitizeReason(reason) {
  if (!reason) return 'Aucune raison fournie';
  return reason
    .replace(/@(everyone|here)/gi, '@\u200Beveryone') // casse les mentions globales
    .replace(/<@[!&]?\d+>/g, '[mention supprimée]')   // supprime les mentions utilisateur
    .replace(/`{1,3}/g, "'")                           // supprime les backticks (injection markdown)
    .slice(0, 200);                                     // limite à 200 caractères
}

// Valide un ID Discord (18-19 chiffres)
function isValidSnowflake(id) {
  return /^\d{17,19}$/.test(id);
}

// ─── DURÉE ────────────────────────────────────────────────────────────────────

function parseDuration(str) {
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;
  const value = parseInt(match[1]);
  const unit = match[2];
  if (value <= 0) return null;
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * multipliers[unit];
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s} seconde(s)`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute(s)`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} heure(s)`;
  return `${Math.floor(h / 24)} jour(s)`;
}

module.exports = { isAdmin, isModerator, canTarget, sanitizeReason, isValidSnowflake, parseDuration, formatDuration };