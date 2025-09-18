import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { sessionStatsTable } from '../db/schema';
import { type GetSessionStatsInput } from '../schema';
import { getSessionStats } from '../handlers/get_session_stats';

// Test input
const testInput: GetSessionStatsInput = {
  session_id: 'test-session-123'
};

describe('getSessionStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return default stats for non-existent session', async () => {
    const result = await getSessionStats(testInput);

    // Should return default stats
    expect(result.session_id).toEqual('test-session-123');
    expect(result.wins).toEqual(0);
    expect(result.losses).toEqual(0);
    expect(result.ties).toEqual(0);
    expect(result.total_games).toEqual(0);
    expect(result.last_played).toBeNull();
  });

  it('should return existing session stats', async () => {
    // Create a session with some stats
    const now = new Date();
    await db.insert(sessionStatsTable)
      .values({
        session_id: testInput.session_id,
        wins: 5,
        losses: 3,
        ties: 2,
        total_games: 10,
        last_played: now
      })
      .execute();

    const result = await getSessionStats(testInput);

    // Should return the actual stats
    expect(result.session_id).toEqual('test-session-123');
    expect(result.wins).toEqual(5);
    expect(result.losses).toEqual(3);
    expect(result.ties).toEqual(2);
    expect(result.total_games).toEqual(10);
    expect(result.last_played).toEqual(now);
  });

  it('should return stats with null last_played', async () => {
    // Create a session with null last_played
    await db.insert(sessionStatsTable)
      .values({
        session_id: testInput.session_id,
        wins: 0,
        losses: 0,
        ties: 0,
        total_games: 0,
        last_played: null
      })
      .execute();

    const result = await getSessionStats(testInput);

    // Should return stats with null last_played
    expect(result.session_id).toEqual('test-session-123');
    expect(result.wins).toEqual(0);
    expect(result.losses).toEqual(0);
    expect(result.ties).toEqual(0);
    expect(result.total_games).toEqual(0);
    expect(result.last_played).toBeNull();
  });

  it('should only return stats for the specified session', async () => {
    // Create stats for multiple sessions
    await db.insert(sessionStatsTable)
      .values([
        {
          session_id: 'session-1',
          wins: 1,
          losses: 2,
          ties: 3,
          total_games: 6,
          last_played: new Date()
        },
        {
          session_id: 'session-2',
          wins: 10,
          losses: 20,
          ties: 30,
          total_games: 60,
          last_played: new Date()
        }
      ])
      .execute();

    // Query for session-1
    const result1 = await getSessionStats({ session_id: 'session-1' });
    expect(result1.session_id).toEqual('session-1');
    expect(result1.wins).toEqual(1);
    expect(result1.losses).toEqual(2);
    expect(result1.ties).toEqual(3);
    expect(result1.total_games).toEqual(6);

    // Query for session-2
    const result2 = await getSessionStats({ session_id: 'session-2' });
    expect(result2.session_id).toEqual('session-2');
    expect(result2.wins).toEqual(10);
    expect(result2.losses).toEqual(20);
    expect(result2.ties).toEqual(30);
    expect(result2.total_games).toEqual(60);

    // Query for non-existent session should return defaults
    const result3 = await getSessionStats({ session_id: 'non-existent' });
    expect(result3.session_id).toEqual('non-existent');
    expect(result3.wins).toEqual(0);
    expect(result3.losses).toEqual(0);
    expect(result3.ties).toEqual(0);
    expect(result3.total_games).toEqual(0);
    expect(result3.last_played).toBeNull();
  });

  it('should handle various date values correctly', async () => {
    // Test with different date scenarios
    const pastDate = new Date('2023-01-01T10:00:00Z');
    
    await db.insert(sessionStatsTable)
      .values({
        session_id: testInput.session_id,
        wins: 1,
        losses: 1,
        ties: 1,
        total_games: 3,
        last_played: pastDate
      })
      .execute();

    const result = await getSessionStats(testInput);

    expect(result.last_played).toBeInstanceOf(Date);
    expect(result.last_played).toEqual(pastDate);
  });
});