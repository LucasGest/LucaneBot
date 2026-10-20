import { Events, time, TimestampStyles } from 'discord.js';
import { log } from '../utils/logger.js';

const NEW_ACCOUNT_DAYS = 7;

export default {
  name: Events.GuildMemberAdd,

  async execute(member) {
    const ageDays = (Date.now() - member.user.createdTimestamp) / 86_400_000;
    const isNew = ageDays < NEW_ACCOUNT_DAYS;

    await log(member.client, {
      type: isNew ? 'warn' : 'info',
      title: isNew ? '📥 Arrivée — ⚠️ compte récent' : '📥 Arrivée',
      description: `${member} (${member.user.tag})`,
      fields: [
        { name: 'Compte créé', value: time(member.user.createdAt, TimestampStyles.RelativeTime), inline: true },
        { name: 'Membres', value: String(member.guild.memberCount), inline: true },
      ],
    });
  },
};
