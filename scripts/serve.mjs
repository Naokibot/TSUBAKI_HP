import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'dist');
const port = Number(process.env.PORT || 4173);
const cliBasePath = process.argv.find((arg) => arg.startsWith('--base-path='))?.split('=', 2)[1] || '';
const normalizeBasePath = (value = '') => {
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === '/') return '';
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}`;
};
const basePath = normalizeBasePath(process.env.SITE_BASE_PATH || cliBasePath);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json' };

const server = createServer(async (req, res) => {
  try {
    const rawPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
    const servedPath = basePath && (rawPath === basePath || rawPath.startsWith(`${basePath}/`))
      ? (rawPath.slice(basePath.length) || '/')
      : rawPath;
    let filePath = path.join(root, servedPath);
    if (!filePath.startsWith(root)) throw new Error('Invalid path');
    let info;
    try { info = await stat(filePath); } catch { info = null; }
    if (info?.isDirectory()) filePath = path.join(filePath, 'index.html');
    if (!info && !path.extname(filePath)) filePath = path.join(filePath, 'index.html');
    const body = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': types[path.extname(filePath)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch {
    try {
      const body = await readFile(path.join(root, '404.html'));
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(body);
    } catch {
      res.writeHead(404); res.end('Not found');
    }
  }
});

server.listen(port, '0.0.0.0', () => console.log(`Hotaru Ascend portfolio: http://localhost:${port}${basePath || '/'}`));
