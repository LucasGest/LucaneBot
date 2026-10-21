import { Events } from 'discord.js';
import { isExempt, checkLinks } from '../security/automod.js';
import { punish } from '../security/sanction.js';

// Un message propre modifié ensuite pour y glisser un lien est contrôlé comme un nouveau message.
// Seuls les liens sont revérifiés : l'anti-spam compte les envois, pas les modifications.
export default {
  name: Events.MessageUpdate,

  async execute(oldMessage, newMessage) {
    const message = newMessage.partial ? await newMessage.fetch().catch(() => null) : newMessage;
    if (!message?.inGuild() || message.author.bot || message.webhookId) return;
    if (oldMessage.content === message.content) return; // aperçu de lien chargé, épinglage…
    if (isExempt(message.member)) return;

    const reason = await checkLinks(message);
    if (reason) await punish(message, `${reason} (message modifié)`);
  },
};
