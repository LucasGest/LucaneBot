import { fileURLToPath } from 'node:url';
import { REST, Routes } from 'discord.js';
import { loadModules } from './loader.js';

// Enregistre les commandes slash sur le serveur (instantané, contrairement au global)
const commands = await loadModules(fileURLToPath(new URL('./commands', import.meta.url)));
const body = commands.map((command) => command.data.toJSON());

const rest = new REST().setToken(process.env.DISCORD_TOKEN);
await rest.put(
  Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
  { body },
);

console.log(`✅ ${body.length} commande(s) déployée(s) : ${body.map((c) => '/' + c.name).join(', ')}`);
