// Réglages de sécurité — modifie les valeurs ici, puis redémarre le bot
export const security = {
  antiSpam: {
    // Flood : plus de X messages en Y secondes
    maxMessages: 6,
    perSeconds: 5,
    // Doublons : le même message X fois en Y secondes
    maxDuplicates: 3,
    duplicateSeconds: 20,
    // Mentions : X personnes/rôles mentionnés dans un seul message
    maxMentions: 5,
  },

  antiLinks: {
    // Invitations vers d'autres serveurs Discord (celles de ton serveur restent autorisées)
    blockInvites: true,
    // Liens d'arnaque (faux Nitro, faux Steam…)
    blockScams: true,
  },

  sanctions: {
    // Timeout de base, doublé à chaque récidive (10 min → 20 → 40…)
    baseTimeoutMinutes: 10,
    maxTimeoutMinutes: 24 * 60,
    // Les récidives sont oubliées après ce délai sans infraction
    strikeResetHours: 6,
  },

  honeypot: {
    // Timeout appliqué à quiconque écrit dans le salon piège
    timeoutMinutes: 24 * 60,
  },
};

// Salon qui affiche si le live Twitch est en cours
export const twitch = {
  onlineName: '🔴 En ligne',
  offlineName: '⚫ Hors ligne',
  checkEverySeconds: 60,
  // Nombre de vérifications "hors ligne" d'affilée avant de repasser le salon en Hors ligne
  offlineConfirmations: 3,
};

// Rôles exemptés de l'automod (en plus de ceux qui ont la permission « Gérer les messages »)
export const exemptRoleIds = (process.env.EXEMPT_ROLE_IDS ?? '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);
