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

// ─── /uptime ───────────────────────────────────────────
const uptime = {
  data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('Voir depuis combien de temps le stream est en ligne'),

  async execute(interaction) {
    await interaction.deferReply();
    const data = await twitchFetch(`streams?user_login=${process.env.TWITCH_USERNAME}`);
    const stream = data.data?.[0];

    if (!stream) {
      return interaction.editReply('❌ Le stream n\'est pas en ligne en ce moment.');
    }

    const started = new Date(stream.started_at);
    const now = new Date();
    const diff = Math.floor((now - started) / 1000);
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;

    const embed = new EmbedBuilder()
      .setColor(0x9146ff)
      .setTitle('⏱️ Uptime du stream')
      .setDescription(`🔴 **${stream.user_name}** est en live depuis **${h}h ${m}m ${s}s**`)
      .addFields(
        { name: '🎮 Jeu', value: stream.game_name || 'Inconnu', inline: true },
        { name: '👥 Viewers', value: `${stream.viewer_count}`, inline: true }
      )
      .setURL(`https://twitch.tv/${process.env.TWITCH_USERNAME}`)
      .setTimestamp();

    interaction.editReply({ embeds: [embed] });
  },
};

// ─── /clip ─────────────────────────────────────────────
const clip = {
  data: new SlashCommandBuilder()
    .setName('clip')
    .setDescription('Voir le dernier clip Twitch'),

  async execute(interaction) {
    await interaction.deferReply();

    // Récupère d'abord l'ID utilisateur
    const userRes = await twitchFetch(`users?login=${process.env.TWITCH_USERNAME}`);
    const userId = userRes.data?.[0]?.id;

    if (!userId) return interaction.editReply('❌ Streamer introuvable.');

    const clipsRes = await twitchFetch(`clips?broadcaster_id=${userId}&first=1`);
    const clipData = clipsRes.data?.[0];

    if (!clipData) return interaction.editReply('❌ Aucun clip trouvé.');

    const embed = new EmbedBuilder()
      .setColor(0x9146ff)
      .setTitle(`🎬 ${clipData.title}`)
      .setDescription(`Créé par **${clipData.creator_name}**`)
      .setURL(clipData.url)
      .setImage(clipData.thumbnail_url)
      .addFields(
        { name: '👁️ Vues', value: `${clipData.view_count}`, inline: true },
        { name: '📅 Date', value: `<t:${Math.floor(new Date(clipData.created_at).getTime() / 1000)}:D>`, inline: true }
      )
      .setFooter({ text: 'Twitch Clip' });

    interaction.editReply({ embeds: [embed] });
  },
};

// ─── /stats ────────────────────────────────────────────
const stats = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Voir les stats Twitch du streamer'),

  async execute(interaction) {
    await interaction.deferReply();

    const userData = await twitchFetch(`users?login=${process.env.TWITCH_USERNAME}`);
    const user = userData.data?.[0];
    if (!user) return interaction.editReply('❌ Streamer introuvable.');

    const channelRes = await twitchFetch(`channels?broadcaster_id=${user.id}`);
    const channel = channelRes.data?.[0];

    const embed = new EmbedBuilder()
      .setColor(0x9146ff)
      .setTitle(`📺 Stats de ${user.display_name}`)
      .setThumbnail(user.profile_image_url)
      .addFields(
        { name: '👥 Followers', value: 'Voir sur Twitch', inline: true },
        { name: '📺 Catégorie', value: channel?.game_name || 'Inconnue', inline: true },
        { name: '🌐 Langue', value: channel?.broadcaster_language?.toUpperCase() || 'FR', inline: true },
        { name: '📝 Description', value: user.description || 'Aucune description', inline: false }
      )
      .setURL(`https://twitch.tv/${process.env.TWITCH_USERNAME}`)
      .setTimestamp();

    interaction.editReply({ embeds: [embed] });
  },
};

module.exports = { uptime, clip, stats };
