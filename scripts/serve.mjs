import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');
const port = Number(process.env.PORT || 4173);
const cliBasePathIndex = process.argv.indexOf('--base-path');
const requestedBasePath = cliBasePathIndex >= 0 ? process.argv[cliBasePathIndex + 1] : (process.env.SITE_BASE_PATH || '');
const basePath = requestedBasePath && requestedBasePath !== '/' ? `/${requestedBasePath.replace(/^\/+|\/+$/g, '')}` : '';

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

createServer(async (request, response) => {
  try {
    let pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
    if (basePath) {
      if (pathname === basePath) pathname = '/';
      else if (pathname.startsWith(`${basePath}/`)) pathname = pathname.slice(basePath.length);
      else {
        response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        response.end('Not found');
        return;
      }
    }
    let filePath = path.join(root, pathname);
    const fileStat = await stat(filePath).catch(() => null);
    if (fileStat?.isDirectory()) filePath = path.join(filePath, 'index.html');
    if (!fileStat && !path.extname(filePath)) filePath = path.join(filePath, 'index.html');
    const safePath = path.resolve(filePath);
    if (!safePath.startsWith(root)) throw new Error('Unsafe path');
    const body = await readFile(safePath);
    response.writeHead(200, {
      'content-type': mime[path.extname(safePath)] || 'application/octet-stream',
      'cache-control': safePath.endsWith('.html') ? 'no-cache' : 'public, max-age=300'
    });
    response.end(body);
  } catch {
    const fallback = await readFile(path.join(root, '404.html')).catch(() => Buffer.from('Not found'));
    response.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    response.end(fallback);
  }
}).listen(port, () => {
  const pathLabel = basePath || '/';
  console.log(`TSUBAKI Portfolio is running at http://localhost:${port}${pathLabel.endsWith('/') ? pathLabel : `${pathLabel}/`}`);
});
