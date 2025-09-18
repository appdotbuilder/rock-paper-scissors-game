import { db } from '../db';
import { sessionStatsTable } from '../db/schema';
import { type GetSessionStatsInput, type SessionStats } from '../schema';
import { eq } from 'drizzle-orm';

export async function getSessionStats(input: GetSessionStatsInput): Promise<SessionStats> {
  try {
    // Query the session stats table for the given session_id
    const results = await db.select()
      .from(sessionStatsTable)
      .where(eq(sessionStatsTable.session_id, input.session_id))
      .execute();

    // If session exists, return the stats
    if (results.length > 0) {
      const stats = results[0];
      return {
        session_id: stats.session_id,
        wins: stats.wins,
        losses: stats.losses,
        ties: stats.ties,
        total_games: stats.total_games,
        last_played: stats.last_played
      };
    }

    // If no session exists, return default stats (all zeros)
    return {
      session_id: input.session_id,
      wins: 0,
      losses: 0,
      ties: 0,
      total_games: 0,
      last_played: null
    };
  } catch (error) {
    console.error('Get session stats failed:', error);
    throw error;
  }
}