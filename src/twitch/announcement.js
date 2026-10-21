import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { liveAnnouncement, selfRoles } from '../config.js';
import { log } from '../utils/logger.js';

// Annonce de live dans le salon LIVE_ANNOUNCE_CHANNEL_ID :
// postée au début (avec ping), mise à jour pendant le live, passée en « terminé » à la fin.
// Rien n'est stocké sur disque : l'annonce en cours est retrouvée dans le salon grâce à son pied de page.

const LIVE_AUTHOR = 'est en live sur Twitch !';
const ENDED_AUTHOR = 'Live terminé';
const FOOTER_PREFIX = 'Lucanebot · stream ';

let current = null; // { message, streamId, startedAt, peakViewers, lastEdit }

function streamUrl(login) {
  return `https://twitch.tv/${login}`;
}

function watchButton(login, label) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(label).setEmoji('📺').setURL(streamUrl(login)),
  );
}

function liveEmbed({ stream, user }, login, peakViewers) {
  const name = user?.display_name ?? login;
  const embed = new EmbedBuilder()
    .setColor(liveAnnouncement.liveColor)
    .setAuthor({ name: `${name} ${LIVE_AUTHOR}`, iconURL: user?.profile_image_url, url: streamUrl(login) })
    .setURL(streamUrl(login))
    .setTimestamp(stream ? new Date(stream.started_at) : new Date());

  if (stream) {
    embed
      .setTitle(stream.title || 'En live !')
      .addFields(
        { name: '🎮 Jeu', value: stream.game_name || 'Non défini', inline: true },
        { name: '👀 Viewers', value: String(stream.viewer_count), inline: true },
        { name: '📈 Pic', value: String(peakViewers), inline: true },
      )
      // Le paramètre t force Discord à recharger l'aperçu au lieu de garder l'ancien en cache
      .setImage(`${stream.thumbnail_url.replace('{width}x{height}', '1280x720')}?t=${Date.now()}`)
      .setFooter({ text: `${FOOTER_PREFIX}${stream.id}` });
  } else {
    embed.setTitle('En live !').setFooter({ text: `${FOOTER_PREFIX}?` });
  }
  if (user?.profile_image_url) embed.setThumbnail(user.profile_image_url);
  return embed;
}

function endedEmbed(previous, { startedAt, peakViewers }) {
  const minutes = Math.round((Date.now() - startedAt) / 60_000);
  const duration = minutes >= 60 ? `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}` : `${minutes} min`;
  const old = previous.embeds[0];

  return new EmbedBuilder()
    .setColor(liveAnnouncement.endedColor)
    .setAuthor({ name: `${ENDED_AUTHOR} · merci d'être passé(e)s ! 💜`, iconURL: old?.author?.iconURL, url: old?.author?.url })
    .setTitle(old?.title ?? 'Live terminé')
    .setURL(old?.url ?? null)
    .addFields(
      { name: '🎮 Jeu', value: old?.fields.find((f) => f.name.includes('Jeu'))?.value ?? '—', inline: true },
      { name: '⏱️ Durée', value: duration, inline: true },
      { name: '📈 Pic de viewers', value: String(peakViewers ?? '—'), inline: true },
    )
    .setThumbnail(old?.thumbnail?.url ?? null)
    .setFooter({ text: old?.footer?.text ?? FOOTER_PREFIX })
    .setTimestamp(new Date());
}

async function getChannel(client) {
  const channelId = process.env.LIVE_ANNOUNCE_CHANNEL_ID;
  return channelId ? client.channels.fetch(channelId) : null;
}

// Dernière annonce « en live » postée par le bot (après un redémarrage par exemple)
async function findOpenAnnouncement(channel) {
  const messages = await channel.messages.fetch({ limit: 20 });
  return messages.find((m) => m.author.id === channel.client.user.id && m.embeds[0]?.author?.name?.endsWith(LIVE_AUTHOR)) ?? null;
}

function readPeak(message) {
  return Number(message.embeds[0]?.fields.find((f) => f.name.includes('Pic'))?.value) || 0;
}

export async function onStart(client, state, login) {
  const channel = await getChannel(client);
  if (!channel) return;

  const streamId = state.stream?.id ?? '?';
  const open = await findOpenAnnouncement(channel);

  // Le bot a redémarré pendant le live : on reprend l'annonce existante au lieu de re-pinger
  if (open && open.embeds[0].footer?.text === `${FOOTER_PREFIX}${streamId}`) {
    current = {
      message: open,
      streamId,
      startedAt: open.embeds[0].timestamp ? Date.parse(open.embeds[0].timestamp) : Date.now(),
      peakViewers: readPeak(open),
      lastEdit: 0,
    };
    return onUpdate(client, state, login);
  }
  // Ancienne annonce restée « en live » (bot éteint à la fin du live précédent) : on la clôture
  if (open) await open.edit({ embeds: [endedEmbed(open, { startedAt: Date.parse(open.embeds[0].timestamp), peakViewers: readPeak(open) })], components: [watchButton(login, 'Voir la chaîne')] });

  // Live commencé depuis longtemps (bot redémarré, erreur de permissions…) : annonce discrète, sans ping
  const startedAt = state.stream ? Date.parse(state.stream.started_at) : Date.now();
  const silent = Date.now() - startedAt > liveAnnouncement.silentAfterMinutes * 60_000;

  // Ping du rôle Notifs live s'il existe, sinon @everyone
  const notifRole = channel.guild.roles.cache.find((role) => role.name === selfRoles.liveNotifName);
  const ping = notifRole ? `${notifRole}` : '@everyone';

  const peakViewers = state.stream?.viewer_count ?? 0;
  const message = await channel.send({
    content: silent ? undefined : liveAnnouncement.message.replaceAll('{url}', streamUrl(login)).replaceAll('{ping}', ping),
    embeds: [liveEmbed(state, login, peakViewers)],
    components: [watchButton(login, 'Regarder le live')],
    allowedMentions: silent ? { parse: [] } : notifRole ? { roles: [notifRole.id] } : { parse: ['everyone'] },
  });
  current = { message, streamId, startedAt, peakViewers, lastEdit: Date.now() };

  await log(client, {
    type: 'success',
    title: silent ? '📣 Annonce de live postée (sans ping, live déjà en cours)' : '📣 Annonce de live postée',
    description: `${message.url}\n**${state.stream?.title ?? ''}**`,
  });
}

export async function onUpdate(client, state, login) {
  if (!current) return onStart(client, state, login);

  current.peakViewers = Math.max(current.peakViewers, state.stream?.viewer_count ?? 0);
  if (Date.now() - current.lastEdit < liveAnnouncement.updateEveryMinutes * 60_000) return;

  await current.message.edit({ embeds: [liveEmbed(state, login, current.peakViewers)] });
  current.lastEdit = Date.now();
}

export async function onEnd(client, state, login) {
  const channel = await getChannel(client);
  if (!channel) return;

  const message = current?.message ?? (await findOpenAnnouncement(channel));
  if (!message) return;

  const startedAt = current?.startedAt ?? Date.parse(message.embeds[0].timestamp);
  const peakViewers = current?.peakViewers ?? readPeak(message);
  await message.edit({ embeds: [endedEmbed(message, { startedAt, peakViewers })], components: [watchButton(login, 'Voir la chaîne')] });
  current = null;
}
