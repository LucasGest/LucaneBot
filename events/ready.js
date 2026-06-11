const { ActivityType } = require('discord.js');

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    console.log(`✅ Connecté : ${client.user.tag}`);

    // Statut du bot - alterne entre plusieurs activités
    const activities = [
      { name: `twitch.tv/${process.env.TWITCH_USERNAME}`, type: ActivityType.Streaming, url: `https://twitch.tv/${process.env.TWITCH_USERNAME}` },
      { name: `la communauté 💜`, type: ActivityType.Watching },
      { name: `/rank pour voir ton niveau`, type: ActivityType.Playing },
    ];

    let i = 0;
    const setActivity = () => {
      client.user.setActivity(activities[i % activities.length]);
      i++;
    };

    setActivity();
    setInterval(setActivity, 30_000);
  },
};