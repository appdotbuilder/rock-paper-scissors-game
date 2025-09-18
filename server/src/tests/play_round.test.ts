import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gameRoundsTable, sessionStatsTable } from '../db/schema';
import { type PlayRoundInput } from '../schema';
import { playRound } from '../handlers/play_round';
import { eq } from 'drizzle-orm';

const testInput: PlayRoundInput = {
  session_id: 'test-session-123',
  player_choice: 'rock'
};

describe('playRound', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should play a round and return valid response', async () => {
    const result = await playRound(testInput);

    // Validate response structure
    expect(result.player_choice).toEqual('rock');
    expect(['rock', 'paper', 'scissors']).toContain(result.computer_choice);
    expect(['win', 'loss', 'tie']).toContain(result.result);
    
    // Validate session stats
    expect(result.session_stats.session_id).toEqual('test-session-123');
    expect(result.session_stats.total_games).toEqual(1);
    expect(result.session_stats.wins + result.session_stats.losses + result.session_stats.ties).toEqual(1);
    expect(result.session_stats.last_played).toBeInstanceOf(Date);
  });

  it('should correctly determine win result', async () => {
    // Mock Math.random to always return 0 (first choice - rock)
    const originalRandom = Math.random;
    Math.random = () => 0; // This will make computer choose 'rock'
    
    try {
      const result = await playRound({
        session_id: 'test-session-win',
        player_choice: 'paper' // Paper beats rock
      });

      expect(result.player_choice).toEqual('paper');
      expect(result.computer_choice).toEqual('rock');
      expect(result.result).toEqual('win');
      expect(result.session_stats.wins).toEqual(1);
      expect(result.session_stats.losses).toEqual(0);
      expect(result.session_stats.ties).toEqual(0);
    } finally {
      Math.random = originalRandom;
    }
  });

  it('should correctly determine loss result', async () => {
    // Mock Math.random to return 0.34 (second choice - paper)
    const originalRandom = Math.random;
    Math.random = () => 0.34; // This will make computer choose 'paper'
    
    try {
      const result = await playRound({
        session_id: 'test-session-loss',
        player_choice: 'rock' // Rock loses to paper
      });

      expect(result.player_choice).toEqual('rock');
      expect(result.computer_choice).toEqual('paper');
      expect(result.result).toEqual('loss');
      expect(result.session_stats.wins).toEqual(0);
      expect(result.session_stats.losses).toEqual(1);
      expect(result.session_stats.ties).toEqual(0);
    } finally {
      Math.random = originalRandom;
    }
  });

  it('should correctly determine tie result', async () => {
    // Mock Math.random to return 0.67 (third choice - scissors)
    const originalRandom = Math.random;
    Math.random = () => 0.67; // This will make computer choose 'scissors'
    
    try {
      const result = await playRound({
        session_id: 'test-session-tie',
        player_choice: 'scissors' // Scissors ties with scissors
      });

      expect(result.player_choice).toEqual('scissors');
      expect(result.computer_choice).toEqual('scissors');
      expect(result.result).toEqual('tie');
      expect(result.session_stats.wins).toEqual(0);
      expect(result.session_stats.losses).toEqual(0);
      expect(result.session_stats.ties).toEqual(1);
    } finally {
      Math.random = originalRandom;
    }
  });

  it('should save game round to database', async () => {
    const result = await playRound(testInput);

    // Query game rounds table
    const gameRounds = await db.select()
      .from(gameRoundsTable)
      .where(eq(gameRoundsTable.session_id, 'test-session-123'))
      .execute();

    expect(gameRounds).toHaveLength(1);
    const savedRound = gameRounds[0];
    expect(savedRound.session_id).toEqual('test-session-123');
    expect(savedRound.player_choice).toEqual('rock');
    expect(savedRound.computer_choice).toEqual(result.computer_choice);
    expect(savedRound.result).toEqual(result.result);
    expect(savedRound.played_at).toBeInstanceOf(Date);
  });

  it('should create new session stats for first game', async () => {
    const result = await playRound(testInput);

    // Query session stats table
    const sessionStats = await db.select()
      .from(sessionStatsTable)
      .where(eq(sessionStatsTable.session_id, 'test-session-123'))
      .execute();

    expect(sessionStats).toHaveLength(1);
    const savedStats = sessionStats[0];
    expect(savedStats.session_id).toEqual('test-session-123');
    expect(savedStats.total_games).toEqual(1);
    expect(savedStats.wins + savedStats.losses + savedStats.ties).toEqual(1);
    expect(savedStats.last_played).toBeInstanceOf(Date);
  });

  it('should update existing session stats for subsequent games', async () => {
    // Play first round
    await playRound(testInput);
    
    // Play second round
    const secondResult = await playRound({
      session_id: 'test-session-123',
      player_choice: 'paper'
    });

    // Query session stats
    const sessionStats = await db.select()
      .from(sessionStatsTable)
      .where(eq(sessionStatsTable.session_id, 'test-session-123'))
      .execute();

    expect(sessionStats).toHaveLength(1);
    const savedStats = sessionStats[0];
    expect(savedStats.session_id).toEqual('test-session-123');
    expect(savedStats.total_games).toEqual(2);
    expect(savedStats.wins + savedStats.losses + savedStats.ties).toEqual(2);
    
    // Verify the stats match what was returned
    expect(savedStats.wins).toEqual(secondResult.session_stats.wins);
    expect(savedStats.losses).toEqual(secondResult.session_stats.losses);
    expect(savedStats.ties).toEqual(secondResult.session_stats.ties);
    expect(savedStats.total_games).toEqual(secondResult.session_stats.total_games);
  });

  it('should handle multiple sessions independently', async () => {
    // Play round in first session
    await playRound({
      session_id: 'session-1',
      player_choice: 'rock'
    });
    
    // Play round in second session
    await playRound({
      session_id: 'session-2',
      player_choice: 'paper'
    });

    // Query both sessions
    const session1Stats = await db.select()
      .from(sessionStatsTable)
      .where(eq(sessionStatsTable.session_id, 'session-1'))
      .execute();
      
    const session2Stats = await db.select()
      .from(sessionStatsTable)
      .where(eq(sessionStatsTable.session_id, 'session-2'))
      .execute();

    expect(session1Stats).toHaveLength(1);
    expect(session2Stats).toHaveLength(1);
    expect(session1Stats[0].total_games).toEqual(1);
    expect(session2Stats[0].total_games).toEqual(1);
  });

  it('should validate all game rule combinations', async () => {
    const originalRandom = Math.random;
    
    try {
      // Test rock vs scissors (rock wins)
      Math.random = () => 0.67; // scissors
      const rockWin = await playRound({
        session_id: 'rules-test-1',
        player_choice: 'rock'
      });
      expect(rockWin.result).toEqual('win');

      // Test paper vs rock (paper wins)  
      Math.random = () => 0; // rock
      const paperWin = await playRound({
        session_id: 'rules-test-2',
        player_choice: 'paper'
      });
      expect(paperWin.result).toEqual('win');

      // Test scissors vs paper (scissors wins)
      Math.random = () => 0.34; // paper
      const scissorsWin = await playRound({
        session_id: 'rules-test-3',
        player_choice: 'scissors'
      });
      expect(scissorsWin.result).toEqual('win');
    } finally {
      Math.random = originalRandom;
    }
  });
});