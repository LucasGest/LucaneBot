<img src="assets/logo.png" alt="LucaneBot" width="140" align="right">

# 🎮 LucaneBot

Bot Discord de la communauté **[Lucanemone](https://twitch.tv/lucanemone)**.

## Fonctionnalités

- 🛡️ **Automod** : anti-flood, anti-doublons, anti-mentions en masse, anti-invitations, anti-liens d'arnaque. La sanction est un timeout qui double à chaque récidive.
- 🍯 **Honeypot** : un salon piège où tout message entraîne une sanction automatique.
- 🔴 **Statut live** : un salon renommé « En ligne » ou « Hors ligne » selon le live Twitch.
- 📣 **Annonce de live** : ping, titre, jeu, viewers et aperçu, mis à jour pendant le live. L'annonce passe en « Live terminé » à la fin, avec la durée et le pic de viewers.
- 👋 **Bienvenue** : une image générée à chaque arrivée (avatar, pseudo, numéro de membre) dans le style arcade néon.
- 📊 **Compteurs** : des salons vocaux « 👥 Membres » et « 💜 Followers Twitch », mis à jour toutes les 10 min.
- 📅 **Planning** : un encadré dans #planning, modifiable avec `/planning-modifier`.
- 📋 **Logs** : démarrage, commandes, erreurs, arrivées (avec une alerte pour les comptes récents) et sanctions.

## Installation

```bash
npm install
cp .env.example .env   # puis remplis les valeurs
npm run deploy         # enregistre les commandes slash
npm start
```

Il faut Node.js 20.6 ou plus récent. Dans le [Developer Portal](https://discord.com/developers/applications), active les intents **Server Members** et **Message Content**.

## Hébergement (Render + UptimeRobot)

- Crée un **Web Service** Render avec la build command `npm install` et la start command `node src/index.js`.
- Mets les variables de `.env.example` dans **Environment Variables**. Render fournit `PORT` tout seul, et le bot ouvre alors une mini page « OK ».
- L'offre gratuite se met en veille après 15 min sans visite. Ajoute un moniteur **UptimeRobot** (HTTP, toutes les 5 min) sur l'URL `https://<ton-service>.onrender.com`.

## Permissions du bot

Gérer les rôles, Gérer les salons, Gérer les messages, Exclure temporairement des membres, Voir les salons, Envoyer des messages, Intégrer des liens, Lire l'historique.

## Commandes

| Commande | Accès | Description |
|---|---|---|
| `/ping` | Tout le monde | Vérifie que le bot répond |
| `/planning` | Tout le monde | Affiche le planning des streams |
| `/planning-modifier` | Admin | `jour`, `retirer`, `note`, `vider` |
| `/setup-compteurs` | Admin | Crée les salons vocaux compteurs |
| `/test-bienvenue` | Admin | Aperçu de l'image de bienvenue |
| `/setup-honeypot` | Admin | Transforme un salon en piège anti-bots |

## Structure

```
src/
├── index.js            démarrage du bot
├── deploy-commands.js  enregistrement des commandes slash
├── config.js           réglages (automod, sanctions, statut live)
├── commands/           une commande par fichier, chargée automatiquement
├── events/             un événement Discord par fichier
├── security/           automod, sanctions, honeypot
├── twitch/             statut live (API Twitch ou decapi.me)
└── utils/logger.js     envoi dans le salon de logs
```
