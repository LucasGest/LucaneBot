import { createServer } from 'node:http';

// Mini serveur web pour les hébergeurs type Render (Web Service) :
// ils exigent un port ouvert, et un ping régulier sur cette URL empêche la mise en veille.
export function startKeepAlive(client) {
  const port = process.env.PORT;
  if (!port) return;

  createServer((req, res) => {
    const ready = client.isReady();
    res.writeHead(ready ? 200 : 503, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(ready ? `OK — ${client.user.tag} en ligne` : 'Bot en cours de démarrage');
  }).listen(port, () => console.log(`🌐 Keep-alive sur le port ${port}`));
}
