import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { handleLeaderboardApi } from './leaderboard-http';

const DIST = join(process.cwd(), 'dist');
const HOST = '0.0.0.0';
const PORT = Number(process.env.PORT) || 47281;

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

function pathname(req: IncomingMessage): string {
  try {
    return new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
      .pathname;
  } catch {
    return '/';
  }
}

async function sendFile(res: ServerResponse, filePath: string): Promise<void> {
  const body = await readFile(filePath);
  const ext = extname(filePath);
  res.statusCode = 200;
  res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');
  res.setHeader('Cache-Control', ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable');
  res.end(body);
}

async function serveStatic(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
): Promise<void> {
  const safe = path.replace(/\.\./g, '');
  const file = safe === '/' || safe === '' ? '/index.html' : safe;
  const filePath = join(DIST, file);
  try {
    await sendFile(res, filePath);
  } catch {
    if (!file.includes('.')) {
      await sendFile(res, join(DIST, 'index.html'));
      return;
    }
    res.statusCode = 404;
    res.end('Not found');
  }
}

const server = createServer(async (req, res) => {
  const path = pathname(req);
  if (await handleLeaderboardApi(req, res, path)) return;
  await serveStatic(req, res, path);
});

server.listen(PORT, HOST, () => {
  console.log(`tetris.plus listening on http://${HOST}:${PORT}`);
});
