import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gameRoundsTable, sessionStatsTable } from '../db/schema';
import { type ResetSessionInput } from '../schema';
import { resetSession } from '../handlers/reset_session';
import { eq } from 'drizzle-orm';

const testInput: ResetSessionInput = {
  session_id: 'test-session-123'
};

describe('resetSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should reset session with no existing data', async () => {
    const result = await resetSession(testInput);

    // Verify returned data structure
    expect(result.session_id).toEqual('test-session-123');
    expect(result.wins).toEqual(0);
    expect(result.losses).toEqual(0);
    expect(result.ties).toEqual(0);
    expect(result.total_games).toEqual(0);
    expect(result.last_played).toBeNull();
  });

  it('should delete game rounds for the session', async () => {
    // Create test game rounds
    await db.insert(gameRoundsTable)
      .values([
        {
          session_id: 'test-session-123',
          player_choice: 'rock',
          computer_choice: 'scissors',
          result: 'win'
        },
        {
          session_id: 'test-session-123',
          player_choice: 'paper',
          computer_choice: 'rock',
          result: 'win'
        },
        {
          session_id: 'other-session',
          player_choice: 'scissors',
          computer_choice: 'paper',
          result: 'win'
        }
      ])
      .execute();

    // Verify game rounds exist before reset
    const roundsBefore = await db.select()
      .from(gameRoundsTable)
      .where(eq(gameRoundsTable.session_id, 'test-session-123'))
      .execute();
    expect(roundsBefore).toHaveLength(2);

    // Reset session
    await resetSession(testInput);

    // Verify game rounds for this session are deleted
    const roundsAfter = await db.select()
      .from(gameRoundsTable)
      .where(eq(gameRoundsTable.session_id, 'test-session-123'))
      .execute();
    expect(roundsAfter).toHaveLength(0);

    // Verify other session's game rounds are not affected
    const otherSessionRounds = await db.select()
      .from(gameRoundsTable)
      .where(eq(gameRoundsTable.session_id, 'other-session'))
      .execute();
    expect(otherSessionRounds).toHaveLength(1);
  });

  it('should delete session stats for the session', async () => {
    // Create test session stats
    await db.insert(sessionStatsTable)
      .values([
        {
          session_id: 'test-session-123',
          wins: 5,
          losses: 3,
          ties: 2,
          total_games: 10,
          last_played: new Date()
        },
        {
          session_id: 'other-session',
          wins: 2,
          losses: 1,
          ties: 0,
          total_games: 3,
          last_played: new Date()
        }
      ])
      .execute();

    // Verify session stats exist before reset
    const statsBefore = await db.select()
      .from(sessionStatsTable)
      .where(eq(sessionStatsTable.session_id, 'test-session-123'))
      .execute();
    expect(statsBefore).toHaveLength(1);
    expect(statsBefore[0].wins).toEqual(5);

    // Reset session
    await resetSession(testInput);

    // Verify session stats for this session are deleted
    const statsAfter = await db.select()
      .from(sessionStatsTable)
      .where(eq(sessionStatsTable.session_id, 'test-session-123'))
      .execute();
    expect(statsAfter).toHaveLength(0);

    // Verify other session's stats are not affected
    const otherSessionStats = await db.select()
      .from(sessionStatsTable)
      .where(eq(sessionStatsTable.session_id, 'other-session'))
      .execute();
    expect(otherSessionStats).toHaveLength(1);
    expect(otherSessionStats[0].wins).toEqual(2);
  });

  it('should reset session with both game rounds and session stats', async () => {
    // Create comprehensive test data
    await db.insert(gameRoundsTable)
      .values([
        {
          session_id: 'test-session-123',
          player_choice: 'rock',
          computer_choice: 'scissors',
          result: 'win'
        },
        {
          session_id: 'test-session-123',
          player_choice: 'paper',
          computer_choice: 'scissors',
          result: 'loss'
        }
      ])
      .execute();

    await db.insert(sessionStatsTable)
      .values({
        session_id: 'test-session-123',
        wins: 1,
        losses: 1,
        ties: 0,
        total_games: 2,
        last_played: new Date()
      })
      .execute();

    // Reset session
    const result = await resetSession(testInput);

    // Verify returned reset stats
    expect(result.session_id).toEqual('test-session-123');
    expect(result.wins).toEqual(0);
    expect(result.losses).toEqual(0);
    expect(result.ties).toEqual(0);
    expect(result.total_games).toEqual(0);
    expect(result.last_played).toBeNull();

    // Verify database cleanup
    const rounds = await db.select()
      .from(gameRoundsTable)
      .where(eq(gameRoundsTable.session_id, 'test-session-123'))
      .execute();
    expect(rounds).toHaveLength(0);

    const stats = await db.select()
      .from(sessionStatsTable)
      .where(eq(sessionStatsTable.session_id, 'test-session-123'))
      .execute();
    expect(stats).toHaveLength(0);
  });

  it('should handle empty session gracefully', async () => {
    // Reset a session that doesn't exist
    const result = await resetSession({ session_id: 'non-existent-session' });

    // Should still return proper reset structure
    expect(result.session_id).toEqual('non-existent-session');
    expect(result.wins).toEqual(0);
    expect(result.losses).toEqual(0);
    expect(result.ties).toEqual(0);
    expect(result.total_games).toEqual(0);
    expect(result.last_played).toBeNull();
  });
});