const { isRateLimited } = require('../utils/rateLimiter');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    // ─── RATE LIMITING ─────────────────────────────────
    if (isRateLimited(interaction.user.id)) {
      return interaction.reply({
        content: '⏳ Tu envoies trop de commandes trop vite. Attends quelques secondes.',
        flags: 64,
      });
    }

    // ─── GUILD ONLY ────────────────────────────────────
    // Bloque l'utilisation des commandes en DM
    if (!interaction.guild) {
      return interaction.reply({
        content: '❌ Les commandes ne fonctionnent que sur un serveur.',
        flags: 64,
      });
    }

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(`Erreur commande ${interaction.commandName}:`, error);
      const msg = { content: '❌ Une erreur est survenue.', flags: 64 };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg);
      } else {
        await interaction.reply(msg);
      }
    }
  },
};