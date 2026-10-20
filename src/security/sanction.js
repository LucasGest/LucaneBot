import { security } from '../config.js';
import { log } from '../utils/logger.js';

const { baseTimeoutMinutes, maxTimeoutMinutes, strikeResetHours } = security.sanctions;

// userId → { count, last } (en mémoire : remis à zéro au redémarrage du bot)
const strikes = new Map();

function addStrike(userId) {
  const now = Date.now();
  const entry = strikes.get(userId);
  const expired = !entry || now - entry.last > strikeResetHours * 3_600_000;
  const count = expired ? 1 : entry.count + 1;
  strikes.set(userId, { count, last: now });
  return count;
}

// Supprime le message, timeout croissant, prévient dans le salon et log le tout
// forceMinutes : durée fixe (ex. honeypot) au lieu du timeout croissant
export async function punish(message, reason, { forceMinutes } = {}) {
  const { member, client } = message;
  const count = addStrike(member.id);
  const minutes = forceMinutes ?? Math.min(baseTimeoutMinutes * 2 ** (count - 1), maxTimeoutMinutes);

  await message.delete().catch(() => {});

  let timeoutOk = true;
  try {
    await member.timeout(minutes * 60_000, `Automod : ${reason}`);
  } catch {
    timeoutOk = false;
  }

  const warning = await message.channel
    .send({
      content: `🛡️ ${member}, ton message a été supprimé (${reason}).${timeoutOk ? ` Timeout ${minutes} min.` : ''}`,
      allowedMentions: { users: [member.id] },
    })
    .catch(() => null);
  if (warning) setTimeout(() => warning.delete().catch(() => {}), 8_000);

  await log(client, {
    type: 'warn',
    title: `🛡️ Automod — ${reason}`,
    description: `${member} (${member.user.tag}) dans ${message.channel}`,
    fields: [
      { name: 'Sanction', value: timeoutOk ? `Timeout ${minutes} min` : '⚠️ Timeout impossible (permissions / hiérarchie des rôles)', inline: true },
      { name: 'Récidive', value: `${count}`, inline: true },
      { name: 'Message', value: (message.content || '*(vide)*').slice(0, 1000) },
    ],
  });
}
