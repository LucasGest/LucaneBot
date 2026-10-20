import { EmbedBuilder } from 'discord.js';
import { security } from '../config.js';
import { punish } from './sanction.js';

const TITLE = '🍯 NE PAS ÉCRIRE DANS CE SALON';

// Rien n'est stocké sur disque (les hébergeurs gratuits l'effacent) :
// le salon vient de HONEYPOT_CHANNEL_ID et le compteur est relu sur le panneau lui-même.
let channelId = process.env.HONEYPOT_CHANNEL_ID || null;

export function isHoneypot(id) {
  return channelId === id;
}

export function honeypotEmbed(count) {
  return new EmbedBuilder()
    .setColor(0xff9f1c)
    .setTitle(TITLE)
    .setDescription(
      'Ce salon est un **piège anti-bots / anti-spam**. Tout message envoyé ici entraîne une **sanction automatique**.\n\n'
      + 'Les vrais membres n\'ont **aucune raison** d\'écrire ici · ne le faites pas.',
    )
    .addFields({ name: 'Sanctions', value: `🍯 ${count}` })
    .setFooter({ text: 'Lucanebot · Honeypot anti-spam' });
}

// Dernier panneau posté par le bot dans le salon
async function findPanel(channel) {
  const messages = await channel.messages.fetch({ limit: 50 });
  return messages.find((m) => m.author.id === channel.client.user.id && m.embeds[0]?.title === TITLE) ?? null;
}

function readCount(panel) {
  const value = panel?.embeds[0]?.fields.find((f) => f.name === 'Sanctions')?.value ?? '';
  return Number(value.match(/\d+/)?.[0] ?? 0);
}

export async function setupHoneypot(channel) {
  const previous = await findPanel(channel).catch(() => null);
  await channel.send({ embeds: [honeypotEmbed(readCount(previous))] });
  await previous?.delete().catch(() => {});
  channelId = channel.id;
}

export async function handleHoneypot(message) {
  await punish(message, 'salon piège (honeypot)', { forceMinutes: security.honeypot.timeoutMinutes });

  const panel = await findPanel(message.channel).catch(() => null);
  await panel?.edit({ embeds: [honeypotEmbed(readCount(panel) + 1)] }).catch(() => {});
}
