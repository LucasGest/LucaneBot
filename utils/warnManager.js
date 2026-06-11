const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/warns.json');

if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

function load() {
  if (!fs.existsSync(DB_PATH)) return {};
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function addWarn(userId) {
  const data = load();
  data[userId] = (data[userId] || 0) + 1;
  save(data);
  return data[userId];
}

function removeWarn(userId) {
  const data = load();
  data[userId] = Math.max(0, (data[userId] || 0) - 1);
  save(data);
  return data[userId];
}

function getWarnCount(userId) {
  const data = load();
  return data[userId] || 0;
}

function resetWarns(userId) {
  const data = load();
  delete data[userId];
  save(data);
}

module.exports = { addWarn, removeWarn, getWarnCount, resetWarns };