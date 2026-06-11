const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/xp.json');

// S'assurer que le dossier data existe
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

function loadData() {
  if (!fs.existsSync(DB_PATH)) return {};
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function saveData(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function getUser(userId) {
  const data = loadData();
  if (!data[userId]) {
    data[userId] = { xp: 0, level: 1, lastMessage: 0 };
    saveData(data);
  }
  return data[userId];
}

function addXP(userId, amount) {
  const data = loadData();
  if (!data[userId]) data[userId] = { xp: 0, level: 1, lastMessage: 0 };

  data[userId].xp += amount;

  // Calcul du niveau : chaque niveau requiert niveau * 100 XP
  let leveledUp = false;
  while (data[userId].xp >= data[userId].level * 100) {
    data[userId].xp -= data[userId].level * 100;
    data[userId].level += 1;
    leveledUp = true;
  }

  saveData(data);
  return { user: data[userId], leveledUp };
}

function getLeaderboard() {
  const data = loadData();
  return Object.entries(data)
    .map(([id, stats]) => ({ id, ...stats }))
    .sort((a, b) => b.level - a.level || b.xp - a.xp)
    .slice(0, 10);
}

module.exports = { getUser, addXP, getLeaderboard };
