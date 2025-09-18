import { db } from '../db';
import { gameRoundsTable } from '../db/schema';
import { type GameRound } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getGameHistory(sessionId: string): Promise<GameRound[]> {
  try {
    // Query all game rounds for the given session_id
    // Order by played_at timestamp (most recent first)
    const results = await db.select()
      .from(gameRoundsTable)
      .where(eq(gameRoundsTable.session_id, sessionId))
      .orderBy(desc(gameRoundsTable.played_at))
      .execute();

    // Return the results directly - no numeric conversions needed for this table
    return results;
  } catch (error) {
    console.error('Failed to get game history:', error);
    throw error;
  }
}