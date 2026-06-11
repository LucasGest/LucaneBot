// Limite les spams de commandes : max 5 commandes par 10 secondes par utilisateur
const usage = new Map();

const MAX_USES = 5;
const WINDOW_MS = 10_000;

function isRateLimited(userId) {
  const now = Date.now();
  const record = usage.get(userId) || { count: 0, start: now };

  if (now - record.start > WINDOW_MS) {
    // Nouvelle fenêtre
    usage.set(userId, { count: 1, start: now });
    return false;
  }

  record.count++;
  usage.set(userId, record);
  return record.count > MAX_USES;
}

module.exports = { isRateLimited };