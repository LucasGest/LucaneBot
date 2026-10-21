import { twitch } from '../config.js';
import { getChannelState } from './status.js';
import { log } from '../utils/logger.js';
import * as statusChannel from './statusChannel.js';
import * as announcement from './announcement.js';
import * as liveRole from './liveRole.js';

// Surveille le live Twitch et prévient les modules : début, mise à jour, fin.
// La fin n'est déclarée qu'après plusieurs vérifications "hors ligne" d'affilée (coupures de stream).
const handlers = [statusChannel, announcement, liveRole];

export function startLiveTracker(client) {
  const login = process.env.TWITCH_LOGIN;
  if (!login) return console.warn('⚠️ TWITCH_LOGIN manquant : suivi du live désactivé');

  let live = null; // null = pas encore vérifié
  let offlineStreak = 0;
  let busy = false;

  async function emit(event, state) {
    for (const handler of handlers) {
      try {
        await handler[event]?.(client, state, login);
      } catch (error) {
        console.error(`❌ Live (${event}) :`, error);
        await log(client, { type: 'error', title: `❌ Live — ${event}`, description: `\`${error.message}\`` });
      }
    }
  }

  async function tick() {
    if (busy) return;
    busy = true;
    try {
      const state = await getChannelState(login);
      if (!state) return;

      if (state.live) {
        offlineStreak = 0;
        await emit(live ? 'onUpdate' : 'onStart', state);
        live = true;
      } else {
        offlineStreak += 1;
        if (live === false) return;
        if (live === true && offlineStreak < twitch.offlineConfirmations) return;
        await emit('onEnd', state);
        live = false;
      }
    } finally {
      busy = false;
    }
  }

  tick();
  setInterval(tick, twitch.checkEverySeconds * 1000);
}
