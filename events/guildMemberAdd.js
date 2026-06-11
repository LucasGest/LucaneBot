const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    const channel = member.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID);
    if (!channel) return;

    // Attribution du rôle nouveau membre
    const newRole = member.guild.roles.cache.get(process.env.ROLE_NOUVEAU_MEMBRE);
    if (newRole) member.roles.add(newRole).catch(console.error);

    const embed = new EmbedBuilder()
      .setColor(0x9146ff)
      .setTitle(`👋 Bienvenue sur le serveur !`)
      .setDescription(
        `Salut ${member} ! Bienvenue dans la communauté de **${member.guild.name}** 🎉\n\n` +
        `📺 Tu peux suivre le live sur [Twitch](https://twitch.tv/${process.env.TWITCH_USERNAME})\n` +
        `🎮 Présente-toi dans le salon dédié !\n` +
        `💬 Chatte pour gagner de l'XP et monter en niveau !`
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '👥 Membre', value: `#${member.guild.memberCount}`, inline: true },
        { name: '📅 Rejoint', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
      )
      .setImage('https://i.imgur.com/your-banner.png') // remplace par ton banner
      .setFooter({ text: `${member.guild.name} • Twitch Community` })
      .setTimestamp();

    channel.send({ content: `Hey ${member} !`, embeds: [embed] });
  },
};
