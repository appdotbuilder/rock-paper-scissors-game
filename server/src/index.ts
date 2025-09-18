import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  playRoundInputSchema, 
  getSessionStatsInputSchema,
  resetSessionInputSchema
} from './schema';

// Import handlers
import { playRound } from './handlers/play_round';
import { getSessionStats } from './handlers/get_session_stats';
import { resetSession } from './handlers/reset_session';
import { getGameHistory } from './handlers/get_game_history';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Play a round of Rock Paper Scissors
  playRound: publicProcedure
    .input(playRoundInputSchema)
    .mutation(({ input }) => playRound(input)),
  
  // Get current session statistics
  getSessionStats: publicProcedure
    .input(getSessionStatsInputSchema)
    .query(({ input }) => getSessionStats(input)),
  
  // Reset session statistics and history
  resetSession: publicProcedure
    .input(resetSessionInputSchema)
    .mutation(({ input }) => resetSession(input)),
  
  // Get game history for a session
  getGameHistory: publicProcedure
    .input(z.object({ session_id: z.string() }))
    .query(({ input }) => getGameHistory(input.session_id)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Rock Paper Scissors TRPC server listening at port: ${port}`);
}

start();