import { ChannelType, PermissionFlagsBits } from 'discord.js';
import { counters } from '../config.js';
import { getFollowerCount } from '../twitch/status.js';

// Salons vocaux « 👥 Membres : 19 », « 💜 Followers Twitch : 2998 ».
// Rien n'est stocké : chaque salon est retrouvé grâce au début de son nom.
const COUNTERS = [
  {
    label: counters.members,
    async value(guild) {
      const members = await guild.members.fetch();
      return members.filter((m) => !m.user.bot).size;
    },
  },
  {
    label: counters.followers,
    value: () => getFollowerCount(process.env.TWITCH_LOGIN),
  },
];

const format = (n) => n.toLocaleString('fr-FR').replace(/\s/g, ' ');

function findChannel(guild, label) {
  return guild.channels.cache.find((c) => c.type === ChannelType.GuildVoice && c.name.startsWith(label));
}

export async function updateCounters(guild) {
  for (const counter of COUNTERS) {
    const channel = findChannel(guild, counter.label);
    if (!channel) continue;
    const value = await counter.value(guild);
    if (value === null || value === undefined) continue;
    const name = `${counter.label} : ${format(value)}`;
    // Discord limite à 2 renommages / 10 min par salon : seulement si le chiffre a changé
    if (channel.name !== name) await channel.setName(name, 'Mise à jour du compteur');
  }
}

// Crée les salons manquants tout en haut du serveur, visibles mais impossibles à rejoindre
export async function setupCounters(guild) {
  const created = [];
  for (const counter of COUNTERS) {
    if (findChannel(guild, counter.label)) continue;
    const channel = await guild.channels.create({
      name: `${counter.label} : …`,
      type: ChannelType.GuildVoice,
      position: 0,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.Connect] },
        { id: guild.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.Connect] },
      ],
      reason: 'Salon compteur',
    });
    created.push(channel);
  }
  await updateCounters(guild);
  return created;
}

export function startCounters(client) {
  const tick = async () => {
    try {
      await updateCounters(await client.guilds.fetch(process.env.GUILD_ID));
    } catch (error) {
      console.error('❌ Compteurs :', error.message);
    }
  };
  tick();
  setInterval(tick, counters.updateEveryMinutes * 60_000);
}
