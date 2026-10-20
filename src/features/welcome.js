import { fileURLToPath } from 'node:url';
import { AttachmentBuilder } from 'discord.js';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { welcome } from '../config.js';
import { log } from '../utils/logger.js';

const asset = (name) => fileURLToPath(new URL(`../../assets/${name}`, import.meta.url));
GlobalFonts.registerFromPath(asset('BebasNeue-Regular.ttf'), 'Bebas Neue');
GlobalFonts.registerFromPath(asset('Montserrat.ttf'), 'Montserrat');

const W = 1100;
const H = 450;
const CYAN = '#2ec5ff';
const ORANGE = '#ff9f1c';
let background = null;

// Les polices n'ont que l'alphabet latin : on retire le reste (emojis, caractères spéciaux)
function printableName(member) {
  for (const name of [member.displayName, member.user.globalName, member.user.username]) {
    const clean = name?.replace(/[^\p{Script=Latin}\d\s._'-]/gu, '').trim();
    if (clean) return clean;
  }
  return 'Nouveau membre';
}

// Texte espacé façon titre de scène (« L E   S T R E A M   V A »)
function spacedText(ctx, text, x, y, spacing) {
  let cursor = x - (ctx.measureText(text).width + spacing * (text.length - 1)) / 2;
  ctx.textAlign = 'left';
  for (const char of text) {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + spacing;
  }
  ctx.textAlign = 'center';
}

function fitFont(ctx, text, family, maxSize, maxWidth) {
  let size = maxSize;
  do ctx.font = `${size}px "${family}"`;
  while (ctx.measureText(text).width > maxWidth && (size -= 4) > 24);
}

export async function renderWelcomeImage(member) {
  background ??= await loadImage(asset('welcome-bg.jpg'));
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Fond + voile sombre pour la lisibilité
  ctx.drawImage(background, 0, 0, W, H);
  const veil = ctx.createLinearGradient(0, 0, 0, H);
  veil.addColorStop(0, 'rgba(5, 10, 25, 0.55)');
  veil.addColorStop(1, 'rgba(5, 10, 25, 0.85)');
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, W, H);

  // Cadre arrondi façon overlay (bordure claire)
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(18, 18, W - 36, H - 36, 26);
  ctx.stroke();

  // Avatar rond avec anneau néon cyan
  const cx = W / 2;
  const cy = 132;
  const r = 82;
  const avatar = await loadImage(member.displayAvatarURL({ extension: 'png', size: 256 }));
  ctx.save();
  ctx.shadowColor = CYAN;
  ctx.shadowBlur = 35;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 7, 0, Math.PI * 2);
  ctx.fillStyle = CYAN;
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(avatar, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // « B I E N V E N U E » cyan espacé, puis le pseudo en gros titre blanc
  ctx.font = '600 26px "Montserrat"';
  ctx.fillStyle = CYAN;
  spacedText(ctx, 'BIENVENUE', cx, 262, 14);

  const name = printableName(member).toUpperCase();
  fitFont(ctx, name, 'Bebas Neue', 104, W - 140);
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 12;
  const shine = ctx.createLinearGradient(0, 270, 0, 360);
  shine.addColorStop(0, '#ffffff');
  shine.addColorStop(1, '#c9d2e3');
  ctx.fillStyle = shine;
  ctx.fillText(name, cx, 356);
  ctx.restore();

  // Ligne d'info en orange
  ctx.font = '600 24px "Montserrat"';
  ctx.fillStyle = ORANGE;
  ctx.fillText(`Membre n°${member.guild.memberCount} · chez ${welcome.serverName}`, cx, 400);

  return canvas.toBuffer('image/png');
}

export async function sendWelcome(member, channel) {
  const image = new AttachmentBuilder(await renderWelcomeImage(member), { name: 'bienvenue.png' });
  return channel.send({
    content: welcome.message.replaceAll('{user}', `${member}`).replaceAll('{count}', member.guild.memberCount),
    files: [image],
    allowedMentions: { users: [member.id] },
  });
}

export async function welcomeMember(member) {
  const channelId = process.env.WELCOME_CHANNEL_ID;
  if (!channelId || member.user.bot) return;
  try {
    await sendWelcome(member, await member.client.channels.fetch(channelId));
  } catch (error) {
    console.error('❌ Bienvenue :', error);
    await log(member.client, { type: 'error', title: '❌ Message de bienvenue', description: `${member}\n\`${error.message}\`` });
  }
}
