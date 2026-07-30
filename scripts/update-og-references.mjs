import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');

async function updateDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await updateDirectory(target);
    else if (entry.isFile() && entry.name.endsWith('.html')) {
      const source = await readFile(target, 'utf8');
      const updated = source.replaceAll('og-image.png', 'og-image.svg');
      if (updated !== source) await writeFile(target, updated);
    }
  }
}

await updateDirectory(root);
