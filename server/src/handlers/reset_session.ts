import { db } from '../db';
import { gameRoundsTable, sessionStatsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type ResetSessionInput, type SessionStats } from '../schema';

export async function resetSession(input: ResetSessionInput): Promise<SessionStats> {
  try {
    // Delete all game rounds for the session
    await db.delete(gameRoundsTable)
      .where(eq(gameRoundsTable.session_id, input.session_id))
      .execute();

    // Delete the session stats record (if it exists)
    await db.delete(sessionStatsTable)
      .where(eq(sessionStatsTable.session_id, input.session_id))
      .execute();

    // Return reset session statistics (all zeros)
    return {
      session_id: input.session_id,
      wins: 0,
      losses: 0,
      ties: 0,
      total_games: 0,
      last_played: null
    };
  } catch (error) {
    console.error('Session reset failed:', error);
    throw error;
  }
}