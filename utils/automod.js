const { addWarn, getWarnCount, resetWarns } = require('./warnManager');
const { logAction } = require('./modLogger');

const spamTracker = new Map();

const WARN_LIMIT_MUTE = 3;
const WARN_LIMIT_KICK = 6;
const MUTE_DURATION = 10 * 60 * 1000; // 10 minutes
const SPAM_THRESHOLD = 5;
const SPAM_WINDOW = 5000;

let mutedRoleId = null;

const ALLOWED_DOMAINS = [
  'discord.com', 'discord.gg', 'discordapp.com',
  'twitch.tv', 'clips.twitch.tv',
];

const LINK_REGEX = /https?:\/\/([\w.-]+)/gi;

async function getOrCreateMutedRole(guild) {
  if (mutedRoleId) {
    const existing = guild.roles.cache.get(mutedRoleId);
    if (existing) return existing;
  }

  let role = guild.roles.cache.find(r => r.name.toLowerCase() === 'muted');

  if (!role) {
    role = await guild.roles.create({
      name: 'Muted',
      color: 0x808080,
      reason: 'Rôle auto-modération créé par Lucanebot',
    });

    for (const channel of guild.channels.cache.values()) {
      await channel.permissionOverwrites.create(role, {
        SendMessages: false,
        AddReactions: false,
        Speak: false,
      }).catch(() => {});
    }

    console.log('✅ Rôle Muted créé automatiquement');
  }

  mutedRoleId = role.id;
  return role;
}

function isLinkAllowed(url) {
  const match = url.match(/https?:\/\/([\w.-]+)/i);
  if (!match) return true;
  const domain = match[1].toLowerCase();
  return ALLOWED_DOMAINS.some(a => domain === a || domain.endsWith('.' + a));
}

function containsForbiddenLink(content) {
  const links = [...content.matchAll(LINK_REGEX)];
  return links.some(l => !isLinkAllowed(l[0]));
}

function isSpamming(userId) {
  const now = Date.now();
  const tracker = spamTracker.get(userId) || { count: 0, firstMessage: now };

  if (now - tracker.firstMessage > SPAM_WINDOW) {
    spamTracker.set(userId, { count: 1, firstMessage: now });
    return false;
  }

  tracker.count++;
  spamTracker.set(userId, tracker);
  return tracker.count >= SPAM_THRESHOLD;
}

async function handleViolation(message, reason, client) {
  const { member, guild, channel } = message;
  if (!member || member.permissions.has('ManageMessages')) return;

  await message.delete().catch(() => {});

  const warnCount = addWarn(member.id);

  // Log dans le salon de modération
  await logAction(client, {
    action: 'warn',
    target: member.user,
    moderator: { tag: 'Auto-Mod', id: 'système' },
    reason: `[AUTO-MOD] ${reason}`,
    extra: `${warnCount} warn(s) au total`,
  });

  if (warnCount >= WARN_LIMIT_KICK) {
    resetWarns(member.id);
    await logAction(client, { action: 'kick', target: member.user, moderator: { tag: 'Auto-Mod', id: 'système' }, reason: `[AUTO-MOD] ${warnCount} warns accumulés` });
    await channel.send(`🚫 ${member} a été **kick** pour accumulation d'infractions. (${reason})`);
    await member.kick(`Auto-mod: ${reason}`).catch(console.error);

  } else if (warnCount >= WARN_LIMIT_MUTE) {
    const mutedRole = await getOrCreateMutedRole(guild);
    await member.roles.add(mutedRole).catch(console.error);
    await channel.send(`🔇 ${member} est **mute 10 minutes** — ${reason}. (${warnCount}/${WARN_LIMIT_KICK} warns)`);

    setTimeout(async () => {
      await member.roles.remove(mutedRole).catch(() => {});
    }, MUTE_DURATION);

  } else {
    await channel.send(`⚠️ ${member}, **avertissement ${warnCount}/${WARN_LIMIT_MUTE}** — ${reason}.`);
  }
}

module.exports = { containsForbiddenLink, isSpamming, handleViolation };