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

// Annonce de live dans #live ({url} = lien de la chaîne, {ping} = rôle Notifs live, ou @everyone s'il n'existe pas)
export const liveAnnouncement = {
  message:
    'Votre streamer préféré est actuellement en live !\n'
    + 'Faisons grandir la bête, le titan, le succulent dieu, l\'incroyable Hulk !!!! kof kof\n\n'
    + 'Rejoignez le sur : {url} {ping}',
  liveColor: 0x2ec5ff, // cyan néon
  endedColor: 0x4f545c, // gris
  // Mise à jour des viewers / titre / aperçu pendant le live
  updateEveryMinutes: 5,
  // Si l'annonce part alors que le live a commencé depuis plus longtemps que ça : pas de ping
  silentAfterMinutes: 10,
};

// Rôles à choisir avec les boutons du panneau (/setup-roles) — retrouvés par leur nom
export const selfRoles = {
  // Rôle pingé par l'annonce de live (à la place de @everyone)
  liveNotifName: '🔔 Notifs live',
  groups: [
    {
      title: '🔔 Notifications',
      roles: [
        { name: '🔔 Notifs live', emoji: '🔴', label: 'Notifs live', description: 'Ping à chaque début de live', mentionable: false },
        { name: '🎉 Notifs événements', emoji: '🎉', label: 'Notifs événements', description: 'Ping pour les events (Among Us du vendredi, soirées jeux…)', mentionable: true },
      ],
    },
    {
      title: '🎮 Jeux',
      roles: [
        { name: 'Valorant', emoji: '🔫', label: 'Valorant', description: 'Trouver des mates Valorant', mentionable: true },
        { name: 'Minecraft', emoji: '⛏️', label: 'Minecraft', description: 'Les parties et serveurs Minecraft', mentionable: true },
        { name: 'Among Us', emoji: '🔪', label: 'Among Us', description: 'Les games Among Us', mentionable: true },
        { name: '🕹️ Autres jeux', emoji: '🕹️', label: 'Autres jeux', description: 'Partant(e) pour les jeux du moment', mentionable: true },
      ],
    },
  ],
};

// Clips Twitch postés automatiquement dans #clips
export const clips = {
  checkEveryMinutes: 5,
  // Fenêtre de recherche (les clips plus anciens ne sont jamais postés)
  lookbackHours: 24,
};

// Message de bienvenue ({user} = mention, {count} = nombre de membres)
export const welcome = {
  serverName: 'Lucanemone',
  message: 'Bienvenue {user} sur le serveur ! 🎮 Installe-toi, va lire les règles et passe dire bonjour dans le général 💬',
};

// Salons vocaux compteurs (mis à jour toutes les X minutes — Discord limite les renommages)
export const counters = {
  updateEveryMinutes: 10,
  members: '👥 Membres',
  followers: '💜 Followers Twitch',
};

// Logs des modifications du serveur
export const serverLogs = {
  // Bots dont les actions sur les salons ne sont pas loguées (vocaux temporaires d'EmpyManager)
  // Leurs modifications de rôles, de réglages ou leurs sanctions restent loguées
  quietBotIds: ['719236419230367798'],
};

// Rôles exemptés de l'automod (en plus de ceux qui ont la permission « Gérer les messages »)
export const exemptRoleIds = (process.env.EXEMPT_ROLE_IDS ?? '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);
