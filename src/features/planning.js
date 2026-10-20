import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

// Planning des streams, affiché dans un encadré du salon PLANNING_CHANNEL_ID.
// Le message lui-même sert de stockage : on le relit pour le modifier (rien sur disque).

export const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const TITLE = '📅 PLANNING DES STREAMS';
const EMPTY = '*Aucun stream prévu pour l\'instant.*';

// { days: { Lundi: '🕗 …' }, note: '' }
function readPlanning(message) {
  const embed = message?.embeds[0];
  const days = {};
  for (const field of embed?.fields ?? []) if (DAYS.includes(field.name)) days[field.name] = field.value;
  const note = embed?.description && embed.description !== EMPTY ? embed.description : '';
  return { days, note };
}

export function planningEmbed({ days, note }) {
  const embed = new EmbedBuilder()
    .setColor(0x2ec5ff)
    .setTitle(TITLE)
    .setFooter({ text: 'Lucanebot · mis à jour' })
    .setTimestamp();

  const fields = DAYS.filter((day) => days[day]).map((day) => ({ name: day, value: days[day], inline: true }));
  if (fields.length) embed.addFields(fields);
  embed.setDescription(note || (fields.length ? null : EMPTY));
  return embed;
}

function twitchButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setLabel('Ma chaîne Twitch')
      .setEmoji('📺')
      .setURL(`https://twitch.tv/${process.env.TWITCH_LOGIN}`),
  );
}

async function getChannel(client) {
  const channelId = process.env.PLANNING_CHANNEL_ID;
  if (!channelId) throw new Error('PLANNING_CHANNEL_ID manquant dans les variables d\'environnement');
  return client.channels.fetch(channelId);
}

async function findPanel(channel) {
  const messages = await channel.messages.fetch({ limit: 50 });
  return messages.find((m) => m.author.id === channel.client.user.id && m.embeds[0]?.title === TITLE) ?? null;
}

export async function getPlanning(client) {
  const channel = await getChannel(client);
  return readPlanning(await findPanel(channel));
}

// Applique une modification au planning et met à jour (ou crée) l'encadré
export async function editPlanning(client, change) {
  const channel = await getChannel(client);
  const panel = await findPanel(channel);
  const planning = readPlanning(panel);
  change(planning);

  const payload = { embeds: [planningEmbed(planning)], components: [twitchButton()] };
  return panel ? panel.edit(payload) : channel.send(payload);
}

export function formatDay(horaire, programme) {
  return `🕗 **${horaire}**\n🎮 ${programme}`;
}
