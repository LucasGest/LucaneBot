import { fileURLToPath } from 'node:url';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { loadModules } from './loader.js';
import { log } from './utils/logger.js';
import { startKeepAlive } from './utils/keepAlive.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // privilégié : arrivées
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // privilégié : automod
  ],
  // Le bot ne peut jamais pinger @everyone, @here ou un rôle, même par erreur
  allowedMentions: { parse: ['users'] },
});

for (const key of ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID', 'LOG_CHANNEL_ID']) {
  if (!process.env[key]) console.warn(`⚠️ ${key} manquant dans .env`);
}

client.commands = new Collection();
for (const command of await loadModules(fileURLToPath(new URL('./commands', import.meta.url)))) {
  client.commands.set(command.data.name, command);
}

for (const event of await loadModules(fileURLToPath(new URL('./events', import.meta.url)))) {
  const handler = (...args) => event.execute(...args, client);
  if (event.once) client.once(event.name, handler);
  else client.on(event.name, handler);
}

process.on('unhandledRejection', (error) => {
  console.error('❌ Erreur non gérée :', error);
  log(client, { type: 'error', title: '❌ Erreur non gérée', description: `\`\`\`${error?.stack ?? error}\`\`\`` });
});

// Diagnostic de connexion (utile sur les hébergeurs aux IP partagées que Discord limite parfois)
client.rest.on('rateLimited', (info) => console.warn(`⏳ Limite Discord : ${info.method} ${info.route}, attente ${info.timeToReset} ms (global: ${info.global})`));
client.on('shardError', (error) => console.error('❌ Erreur de connexion Discord :', error.message));
client.on('shardDisconnect', (event) => console.warn(`⚠️ Déconnecté de Discord (code ${event.code})`));

// Si la connexion n'aboutit pas, on quitte : l'hébergeur relance le bot (souvent sur une autre IP)
const LOGIN_TIMEOUT_MS = 60_000;
const watchdog = setTimeout(() => {
  console.error(`❌ Pas connecté à Discord après ${LOGIN_TIMEOUT_MS / 1000} s, redémarrage`);
  process.exit(1);
}, LOGIN_TIMEOUT_MS);
client.once('clientReady', () => clearTimeout(watchdog));

startKeepAlive(client);
console.log('🔌 Connexion à Discord…');
try {
  await client.login(process.env.DISCORD_TOKEN);
} catch (error) {
  console.error('❌ Connexion refusée par Discord :', error.code ?? '', error.message);
  process.exit(1);
}
