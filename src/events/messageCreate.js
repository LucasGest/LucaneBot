import { Events } from 'discord.js';
import { isExempt, checkSpam, checkLinks } from '../security/automod.js';
import { isHoneypot, handleHoneypot } from '../security/honeypot.js';
import { punish } from '../security/sanction.js';

export default {
  name: Events.MessageCreate,

  async execute(message) {
    if (!message.inGuild() || message.author.bot || message.webhookId) return;
    if (isExempt(message.member)) return;

    if (isHoneypot(message.channelId)) return handleHoneypot(message);

    const reason = (await checkLinks(message)) ?? checkSpam(message);
    if (reason) await punish(message, reason);
  },
};
