const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Vérifie la latence du bot'),

  async execute(interaction, client) {
    const sent = await interaction.reply({ content: '🏓 Calcul...', withResponse: true });
    const latency = sent.resource.message.createdTimestamp - interaction.createdTimestamp;
    const wsLatency = client.ws.ping;

    await interaction.editReply(
      `🏓 **Pong !**\n📡 Latence : **${latency}ms**\n💓 WebSocket : **${wsLatency}ms**`
    );
  },
};