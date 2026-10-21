import type { Plugin, Connect } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleLeaderboardApi } from './server/leaderboard-http';

function leaderboardMiddleware(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    const url = req.url?.split('?')[0] ?? '';
    const handled = await handleLeaderboardApi(
      req as IncomingMessage,
      res as ServerResponse,
      url,
    );
    if (!handled) next();
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
