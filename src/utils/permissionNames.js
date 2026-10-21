import { PermissionsBitField } from 'discord.js';

// Noms des permissions tels qu'affichés dans Discord en français
const FR = {
  Administrator: 'Administrateur',
  ManageGuild: 'Gérer le serveur',
  ManageRoles: 'Gérer les rôles',
  ManageChannels: 'Gérer les salons',
  ManageWebhooks: 'Gérer les webhooks',
  ManageGuildExpressions: 'Gérer les expressions',
  CreateGuildExpressions: 'Créer des expressions',
  ViewAuditLog: 'Voir les logs du serveur',
  ViewGuildInsights: 'Voir les statistiques',
  ViewCreatorMonetizationAnalytics: 'Voir la monétisation',
  KickMembers: 'Expulser',
  BanMembers: 'Bannir',
  ModerateMembers: 'Exclure temporairement',
  ManageNicknames: 'Gérer les pseudos',
  ChangeNickname: 'Changer de pseudo',
  CreateInstantInvite: 'Créer une invitation',
  ViewChannel: 'Voir les salons',
  SendMessages: 'Envoyer des messages',
  SendMessagesInThreads: 'Envoyer dans les fils',
  CreatePublicThreads: 'Créer des fils publics',
  CreatePrivateThreads: 'Créer des fils privés',
  ManageThreads: 'Gérer les fils',
  ManageMessages: 'Gérer les messages',
  PinMessages: 'Épingler des messages',
  BypassSlowmode: 'Ignorer le mode lent',
  EmbedLinks: 'Intégrer des liens',
  AttachFiles: 'Joindre des fichiers',
  ReadMessageHistory: 'Voir l\'historique',
  MentionEveryone: 'Mentionner @everyone',
  AddReactions: 'Ajouter des réactions',
  UseExternalEmojis: 'Émojis externes',
  UseExternalStickers: 'Autocollants externes',
  UseApplicationCommands: 'Commandes d\'applications',
  UseExternalApps: 'Applications externes',
  SendTTSMessages: 'Messages TTS',
  SendVoiceMessages: 'Messages vocaux',
  SendPolls: 'Créer des sondages',
  Connect: 'Se connecter',
  Speak: 'Parler',
  Stream: 'Vidéo',
  UseVAD: 'Détection de la voix',
  PrioritySpeaker: 'Voix prioritaire',
  MuteMembers: 'Rendre muet',
  DeafenMembers: 'Mettre en sourdine',
  MoveMembers: 'Déplacer des membres',
  UseSoundboard: 'Soundboard',
  UseExternalSounds: 'Sons externes',
  UseEmbeddedActivities: 'Activités',
  RequestToSpeak: 'Demander la parole',
  SetVoiceChannelStatus: 'Statut du salon vocal',
  ManageEvents: 'Gérer les événements',
  CreateEvents: 'Créer des événements',
};

export const permissionName = (flag) => FR[flag] ?? flag;

export function permissionNames(bits) {
  return new PermissionsBitField(BigInt(bits ?? 0)).toArray().map(permissionName);
}

// Permissions ajoutées / retirées entre deux valeurs
export function permissionDiff(oldBits, newBits) {
  const before = new Set(new PermissionsBitField(BigInt(oldBits ?? 0)).toArray());
  const after = new Set(new PermissionsBitField(BigInt(newBits ?? 0)).toArray());
  return {
    added: [...after].filter((p) => !before.has(p)).map(permissionName),
    removed: [...before].filter((p) => !after.has(p)).map(permissionName),
  };
}
