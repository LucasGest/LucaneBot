import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// Importe tous les fichiers .js d'un dossier (sous-dossiers compris)
export async function loadModules(dir) {
  const modules = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      modules.push(...(await loadModules(path)));
    } else if (entry.name.endsWith('.js')) {
      const mod = await import(pathToFileURL(path).href);
      modules.push(mod.default);
    }
  }
  return modules;
}
