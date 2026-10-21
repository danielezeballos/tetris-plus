import type { IncomingMessage, ServerResponse } from 'node:http';
import { getLeaderboards, submitScore } from './leaderboard-file';

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

/** Handle /api/leaderboards. Returns true if the request was handled. */
export async function handleLeaderboardApi(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
): Promise<boolean> {
  if (pathname !== '/api/leaderboards') return false;
  try {
    if (req.method === 'GET') {
      const boards = await getLeaderboards();
      sendJson(res, 200, boards);
      return true;
    }
    if (req.method === 'POST') {
      const raw = await readBody(req);
      const body = JSON.parse(raw) as { score?: number; name?: string };
      const score = Number(body.score);
      if (!Number.isFinite(score) || score < 0) {
        sendJson(res, 400, { error: 'invalid score' });
        return true;
      }
      const name = typeof body.name === 'string' ? body.name : '';
      const result = await submitScore(Math.floor(score), name);
      sendJson(res, 200, result);
      return true;
    }
    sendJson(res, 405, { error: 'method not allowed' });
    return true;
  } catch {
    sendJson(res, 500, { error: 'server error' });
    return true;
  }
}
