import { Events, MessageFlags } from 'discord.js';
import { log } from '../utils/logger.js';

export default {
  name: Events.InteractionCreate,

  async execute(interaction, client) {
    if (!interaction.inGuild() || !interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    const where = `${interaction.user} dans ${interaction.channel ?? 'MP'}`;

    try {
      await command.execute(interaction);
      await log(client, { title: `⚡ /${interaction.commandName}`, description: where });
    } catch (error) {
      console.error(`❌ Erreur dans /${interaction.commandName} :`, error);
      await log(client, {
        type: 'error',
        title: `❌ Erreur dans /${interaction.commandName}`,
        description: `${where}\n\`\`\`${error.stack ?? error}\`\`\``,
      });

      const reply = { content: 'Oups, une erreur est survenue 😕', flags: MessageFlags.Ephemeral };
      if (interaction.replied || interaction.deferred) await interaction.followUp(reply).catch(() => {});
      else await interaction.reply(reply).catch(() => {});
    }
  },
};
