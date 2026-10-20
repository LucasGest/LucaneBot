import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { EmbedBuilder } from 'discord.js';
import { security } from '../config.js';
import { punish } from './sanction.js';

const DATA_DIR = new URL('../../data/', import.meta.url);
const FILE = new URL('honeypot.json', DATA_DIR);

// { channelId, messageId, count } — conservé sur disque pour survivre aux redémarrages
function load() {
  try {
    return JSON.parse(readFileSync(FILE, 'utf8'));
  } catch {
    return { channelId: null, messageId: null, count: 0 };
  }
}

function save(state) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(state, null, 2));
}

let state = load();

export function isHoneypot(channelId) {
  return state.channelId === channelId;
}

export function honeypotEmbed(count) {
  return new EmbedBuilder()
    .setColor(0xff9f1c)
    .setTitle('🍯 NE PAS ÉCRIRE DANS CE SALON')
    .setDescription(
      'Ce salon est un **piège anti-bots / anti-spam**. Tout message envoyé ici entraîne une **sanction automatique**.\n\n'
      + 'Les vrais membres n\'ont **aucune raison** d\'écrire ici · ne le faites pas.',
    )
    .addFields({ name: 'Sanctions', value: `🍯 ${count}` })
    .setFooter({ text: 'Lucanebot · Honeypot anti-spam' });
}

export async function setupHoneypot(channel) {
  const message = await channel.send({ embeds: [honeypotEmbed(state.count)] });
  state = { ...state, channelId: channel.id, messageId: message.id };
  save(state);
}

export async function handleHoneypot(message) {
  await punish(message, 'salon piège (honeypot)', { forceMinutes: security.honeypot.timeoutMinutes });

  state.count += 1;
  save(state);

  const panel = await message.channel.messages.fetch(state.messageId).catch(() => null);
  await panel?.edit({ embeds: [honeypotEmbed(state.count)] }).catch(() => {});
}
