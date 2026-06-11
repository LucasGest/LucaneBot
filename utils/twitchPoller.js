const { EmbedBuilder } = require('discord.js');

let isLive = false;
let accessToken = null;
let liveMessageId = null; // ID du message de notif pour le mettre à jour

async function getTwitchToken() {
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  );
  const data = await res.json();
  return data.access_token;
}

async function checkStream() {
  if (!accessToken) accessToken = await getTwitchToken();

  const res = await fetch(
    `https://api.twitch.tv/helix/streams?user_login=${process.env.TWITCH_USERNAME}`,
    {
      headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (res.status === 401) {
    accessToken = await getTwitchToken();
    return null;
  }

  const data = await res.json();
  return data.data?.[0] || null;
}

function buildLiveEmbed(stream) {
  return new EmbedBuilder()
    .setColor(0x9146ff)
    .setTitle(`🔴 ${stream.user_name} est en LIVE !`)
    .setDescription(`**${stream.title}**\n\n🎮 Joue à **${stream.game_name || 'Inconnu'}**`)
    .setURL(`https://twitch.tv/${process.env.TWITCH_USERNAME}`)
    .setThumbnail(
      stream.thumbnail_url.replace('{width}', '320').replace('{height}', '180')
    )
    .addFields(
      { name: '👥 Viewers', value: `${stream.viewer_count}`, inline: true },
      { name: '🎮 Jeu', value: stream.game_name || 'Inconnu', inline: true },
      { name: '🕐 Depuis', value: `<t:${Math.floor(new Date(stream.started_at).getTime() / 1000)}:R>`, inline: true }
    )
    .setFooter({ text: 'Mis à jour toutes les 60s • Twitch Live' })
    .setTimestamp();
}

async function updateVoiceChannel(client, stream) {
  const voiceChannel = client.channels.cache.get(process.env.LIVE_COUNTER_CHANNEL_ID);
  if (!voiceChannel) return;

  try {
    if (stream) {
      await voiceChannel.setName(`🔴 En live • ${stream.viewer_count} viewers`);
    } else {
      await voiceChannel.setName(`⚫ Hors ligne`);
    }
  } catch (err) {
    console.error('Erreur mise à jour salon vocal:', err.message);
  }
}

async function startTwitchPoller(client) {
  console.log('🟣 Poller Twitch démarré');

  // Initialise le salon vocal au démarrage
  await updateVoiceChannel(client, null);

  setInterval(async () => {
    try {
      const stream = await checkStream();
      const channel = client.channels.cache.get(process.env.LIVE_NOTIF_CHANNEL_ID);

      if (stream && !isLive) {
        // 🔴 Passage en LIVE
        isLive = true;
        console.log(`🔴 ${process.env.TWITCH_USERNAME} est maintenant en live !`);

        // Mise à jour salon vocal
        await updateVoiceChannel(client, stream);

        if (!channel) return;

        const embed = buildLiveEmbed(stream);
        const msg = await channel.send({
          content: `@everyone 🎉 **${stream.user_name}** est en live ! Venez nombreux !`,
          embeds: [embed],
        });
        liveMessageId = msg.id;

      } else if (stream && isLive) {
        // 🔄 Mise à jour en temps réel du message + salon vocal
        await updateVoiceChannel(client, stream);

        if (channel && liveMessageId) {
          try {
            const msg = await channel.messages.fetch(liveMessageId);
            await msg.edit({ embeds: [buildLiveEmbed(stream)] });
          } catch {
            liveMessageId = null; // Message supprimé, on arrête de mettre à jour
          }
        }

      } else if (!stream && isLive) {
        // ⚫ Fin de live
        isLive = false;
        liveMessageId = null;
        console.log(`⚫ ${process.env.TWITCH_USERNAME} a terminé son live.`);

        // Réinitialise le salon vocal
        await updateVoiceChannel(client, null);

        if (channel) {
          channel.send(`⚫ Le live est terminé. Merci à tous d'avoir été là ! 💜`);
        }
      }
    } catch (err) {
      console.error('Erreur Twitch poller:', err.message);
    }
  }, 60_000);
}

module.exports = { startTwitchPoller };