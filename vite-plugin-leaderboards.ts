import type { Plugin, Connect } from 'vite';
import { getLeaderboards, submitScore } from './server/leaderboard-file';

function sendJson(
  res: Connect.ServerResponse,
  status: number,
  body: unknown,
): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

async function readBody(req: Connect.IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

function leaderboardMiddleware(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    const url = req.url?.split('?')[0];
    if (url !== '/api/leaderboards') {
      next();
      return;
    }
    try {
      if (req.method === 'GET') {
        const boards = await getLeaderboards();
        sendJson(res, 200, boards);
        return;
      }
      if (req.method === 'POST') {
        const raw = await readBody(req);
        const body = JSON.parse(raw) as { score?: number; name?: string };
        const score = Number(body.score);
        if (!Number.isFinite(score) || score < 0) {
          sendJson(res, 400, { error: 'invalid score' });
          return;
        }
        const name = typeof body.name === 'string' ? body.name : '';
        const result = await submitScore(Math.floor(score), name);
        sendJson(res, 200, result);
        return;
      }
      sendJson(res, 405, { error: 'method not allowed' });
    } catch {
      sendJson(res, 500, { error: 'server error' });
    }
  };
}

export function leaderboardsApiPlugin(): Plugin {
  const attach = (server: { middlewares: Connect.Server }) => {
    server.middlewares.use(leaderboardMiddleware());
  };
  return {
    name: 'leaderboards-api',
    configureServer: attach,
    configurePreviewServer: attach,
  };
}
