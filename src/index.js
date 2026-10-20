import { fileURLToPath } from 'node:url';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { loadModules } from './loader.js';
import { log } from './utils/logger.js';

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

await client.login(process.env.DISCORD_TOKEN);
