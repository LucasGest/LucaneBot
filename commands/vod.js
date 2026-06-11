const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

let accessToken = null;

async function getTwitchToken() {
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  );
  const data = await res.json();
  return data.access_token;
}

async function twitchFetch(endpoint) {
  if (!accessToken) accessToken = await getTwitchToken();
  const res = await fetch(`https://api.twitch.tv/helix/${endpoint}`, {
    headers: {
      'Client-ID': process.env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (res.status === 401) {
    accessToken = await getTwitchToken();
    return twitchFetch(endpoint);
  }
  return res.json();
}

function formatDuration(duration) {
  // Format Twitch : "1h23m45s"
  const h = duration.match(/(\d+)h/)?.[1];
  const m = duration.match(/(\d+)m/)?.[1];
  const s = duration.match(/(\d+)s/)?.[1];
  return [h && `${h}h`, m && `${m}m`, s && `${s}s`].filter(Boolean).join(' ');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vod')
    .setDescription('Voir le dernier VOD Twitch'),

  async execute(interaction) {
    await interaction.deferReply();

    const userRes = await twitchFetch(`users?login=${process.env.TWITCH_USERNAME}`);
    const userId = userRes.data?.[0]?.id;
    if (!userId) return interaction.editReply('❌ Streamer introuvable.');

    const vodRes = await twitchFetch(`videos?user_id=${userId}&first=1&type=archive`);
    const vod = vodRes.data?.[0];

    if (!vod) return interaction.editReply('❌ Aucun VOD disponible.');

    const embed = new EmbedBuilder()
      .setColor(0x9146ff)
      .setTitle(`📼 ${vod.title}`)
      .setURL(vod.url)
      .setThumbnail(
        vod.thumbnail_url
          .replace('%{width}', '320')
          .replace('%{height}', '180')
      )
      .addFields(
        { name: '⏱️ Durée', value: formatDuration(vod.duration), inline: true },
        { name: '👁️ Vues', value: `${vod.view_count}`, inline: true },
        { name: '📅 Date', value: `<t:${Math.floor(new Date(vod.created_at).getTime() / 1000)}:D>`, inline: true }
      )
      .setFooter({ text: 'Twitch VOD' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};