import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gameRoundsTable } from '../db/schema';
import { getGameHistory } from '../handlers/get_game_history';

describe('getGameHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for session with no games', async () => {
    const result = await getGameHistory('empty-session');
    
    expect(result).toEqual([]);
  });

  it('should return game history for a session', async () => {
    // Create test game rounds
    const testRounds = [
      {
        session_id: 'test-session',
        player_choice: 'rock' as const,
        computer_choice: 'scissors' as const,
        result: 'win' as const
      },
      {
        session_id: 'test-session',
        player_choice: 'paper' as const,
        computer_choice: 'rock' as const,
        result: 'win' as const
      },
      {
        session_id: 'test-session',
        player_choice: 'scissors' as const,
        computer_choice: 'scissors' as const,
        result: 'tie' as const
      }
    ];

    // Insert test rounds
    const insertedRounds = await db.insert(gameRoundsTable)
      .values(testRounds)
      .returning()
      .execute();

    const result = await getGameHistory('test-session');

    // Should return all rounds for the session
    expect(result).toHaveLength(3);
    
    // Verify basic properties of returned rounds
    result.forEach((round, index) => {
      expect(round.id).toBeDefined();
      expect(round.session_id).toEqual('test-session');
      expect(round.player_choice).toMatch(/^(rock|paper|scissors)$/);
      expect(round.computer_choice).toMatch(/^(rock|paper|scissors)$/);
      expect(round.result).toMatch(/^(win|loss|tie)$/);
      expect(round.played_at).toBeInstanceOf(Date);
    });

    // Verify specific round data
    const roundData = result.map(r => ({
      player_choice: r.player_choice,
      computer_choice: r.computer_choice,
      result: r.result
    }));

    expect(roundData).toEqual(
      expect.arrayContaining([
        { player_choice: 'rock', computer_choice: 'scissors', result: 'win' },
        { player_choice: 'paper', computer_choice: 'rock', result: 'win' },
        { player_choice: 'scissors', computer_choice: 'scissors', result: 'tie' }
      ])
    );
  });

  it('should return games ordered by most recent first', async () => {
    // Create test rounds with different timestamps
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const twoMinutesAgo = new Date(now.getTime() - 120000);

    const testRounds = [
      {
        session_id: 'ordered-session',
        player_choice: 'rock' as const,
        computer_choice: 'paper' as const,
        result: 'loss' as const,
        played_at: twoMinutesAgo // Oldest
      },
      {
        session_id: 'ordered-session',
        player_choice: 'paper' as const,
        computer_choice: 'scissors' as const,
        result: 'loss' as const,
        played_at: oneMinuteAgo // Middle
      },
      {
        session_id: 'ordered-session',
        player_choice: 'scissors' as const,
        computer_choice: 'rock' as const,
        result: 'loss' as const,
        played_at: now // Most recent
      }
    ];

    await db.insert(gameRoundsTable)
      .values(testRounds)
      .execute();

    const result = await getGameHistory('ordered-session');

    expect(result).toHaveLength(3);
    
    // Should be ordered by most recent first
    expect(result[0].played_at >= result[1].played_at).toBe(true);
    expect(result[1].played_at >= result[2].played_at).toBe(true);
    
    // Verify the specific order based on player choices
    expect(result[0].player_choice).toEqual('scissors'); // Most recent
    expect(result[1].player_choice).toEqual('paper'); // Middle
    expect(result[2].player_choice).toEqual('rock'); // Oldest
  });

  it('should only return games for the specified session', async () => {
    // Create rounds for multiple sessions
    const testRounds = [
      {
        session_id: 'session-1',
        player_choice: 'rock' as const,
        computer_choice: 'scissors' as const,
        result: 'win' as const
      },
      {
        session_id: 'session-1',
        player_choice: 'paper' as const,
        computer_choice: 'rock' as const,
        result: 'win' as const
      },
      {
        session_id: 'session-2',
        player_choice: 'scissors' as const,
        computer_choice: 'rock' as const,
        result: 'loss' as const
      },
      {
        session_id: 'session-2',
        player_choice: 'rock' as const,
        computer_choice: 'paper' as const,
        result: 'loss' as const
      }
    ];

    await db.insert(gameRoundsTable)
      .values(testRounds)
      .execute();

    // Get history for session-1
    const session1Results = await getGameHistory('session-1');
    expect(session1Results).toHaveLength(2);
    session1Results.forEach(round => {
      expect(round.session_id).toEqual('session-1');
    });

    // Get history for session-2
    const session2Results = await getGameHistory('session-2');
    expect(session2Results).toHaveLength(2);
    session2Results.forEach(round => {
      expect(round.session_id).toEqual('session-2');
    });

    // Verify the results are different
    expect(session1Results[0].id).not.toEqual(session2Results[0].id);
  });

  it('should handle large number of games efficiently', async () => {
    // Create a larger dataset to test performance
    const choices = ['rock', 'paper', 'scissors'] as const;
    const results = ['win', 'loss', 'tie'] as const;
    
    const largeTestRounds = Array.from({ length: 50 }, (_, index) => ({
      session_id: 'large-session',
      player_choice: choices[index % 3],
      computer_choice: choices[(index + 1) % 3],
      result: results[index % 3]
    }));

    await db.insert(gameRoundsTable)
      .values(largeTestRounds)
      .execute();

    const result = await getGameHistory('large-session');

    expect(result).toHaveLength(50);
    
    // Verify all rounds belong to the correct session
    result.forEach(round => {
      expect(round.session_id).toEqual('large-session');
      expect(round.id).toBeDefined();
      expect(round.played_at).toBeInstanceOf(Date);
    });

    // Verify ordering (most recent first)
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].played_at >= result[i + 1].played_at).toBe(true);
    }
  });
});