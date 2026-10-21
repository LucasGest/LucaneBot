import { Events, MessageFlags } from 'discord.js';
import { log } from '../utils/logger.js';
import { BUTTON_PREFIX, handleRoleButton } from '../features/selfRoles.js';

export default {
  name: Events.InteractionCreate,

  async execute(interaction, client) {
    if (!interaction.inGuild()) return;

    let name;
    let run;
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      name = `/${interaction.commandName}`;

      // Double sécurité : la permission par défaut de la commande est revérifiée ici, au cas où
      // les réglages Discord (Paramètres → Intégrations) l'auraient ouverte à plus de monde
      const required = command?.data.default_member_permissions;
      if (required && !interaction.memberPermissions.has(BigInt(required))) {
        await log(client, { type: 'warn', title: `⛔ ${name} refusée`, description: `${interaction.user} n'a pas la permission requise` });
        return interaction.reply({ content: '⛔ Tu n\'as pas la permission d\'utiliser cette commande.', flags: MessageFlags.Ephemeral });
      }
      run = command && (() => command.execute(interaction));
    } else if (interaction.isButton() && interaction.customId.startsWith(BUTTON_PREFIX)) {
      name = 'panneau de rôles';
      run = () => handleRoleButton(interaction);
    }
    if (!run) return;

    const where = `${interaction.user} dans ${interaction.channel ?? 'MP'}`;

    try {
      await run();
      if (interaction.isChatInputCommand()) {
        await log(client, { title: `⚡ ${name}`, description: where });
      }
    } catch (error) {
      console.error(`❌ Erreur dans ${name} :`, error);
      await log(client, {
        type: 'error',
        title: `❌ Erreur dans ${name}`,
        description: `${where}\n\`\`\`${error.stack ?? error}\`\`\``,
      });

      const reply = { content: 'Oups, une erreur est survenue 😕', flags: MessageFlags.Ephemeral };
      if (interaction.replied || interaction.deferred) await interaction.followUp(reply).catch(() => {});
      else await interaction.reply(reply).catch(() => {});
    }
  },
};
