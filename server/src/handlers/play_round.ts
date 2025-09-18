import { db } from '../db';
import { gameRoundsTable, sessionStatsTable } from '../db/schema';
import { type PlayRoundInput, type PlayRoundResponse, type GameChoice, type GameResult } from '../schema';
import { eq } from 'drizzle-orm';

export async function playRound(input: PlayRoundInput): Promise<PlayRoundResponse> {
  try {
    // 1. Generate a random computer choice
    const computerChoices: GameChoice[] = ['rock', 'paper', 'scissors'];
    const computerChoice = computerChoices[Math.floor(Math.random() * computerChoices.length)]!;
    
    // 2. Determine the result based on game rules
    let result: GameResult;
    if (input.player_choice === computerChoice) {
      result = 'tie';
    } else if (
      (input.player_choice === 'rock' && computerChoice === 'scissors') ||
      (input.player_choice === 'paper' && computerChoice === 'rock') ||
      (input.player_choice === 'scissors' && computerChoice === 'paper')
    ) {
      result = 'win';
    } else {
      result = 'loss';
    }
    
    // 3. Store the game round in the database
    await db.insert(gameRoundsTable)
      .values({
        session_id: input.session_id,
        player_choice: input.player_choice,
        computer_choice: computerChoice,
        result: result
      })
      .execute();
    
    // 4. Get current session stats or create new ones
    const existingStats = await db.select()
      .from(sessionStatsTable)
      .where(eq(sessionStatsTable.session_id, input.session_id))
      .execute();
    
    let sessionStats;
    const currentTime = new Date();
    
    if (existingStats.length === 0) {
      // Create new session stats
      const newStats = {
        session_id: input.session_id,
        wins: result === 'win' ? 1 : 0,
        losses: result === 'loss' ? 1 : 0,
        ties: result === 'tie' ? 1 : 0,
        total_games: 1,
        last_played: currentTime
      };
      
      await db.insert(sessionStatsTable)
        .values(newStats)
        .execute();
        
      sessionStats = newStats;
    } else {
      // Update existing session stats
      const currentStats = existingStats[0];
      const updatedStats = {
        wins: currentStats.wins + (result === 'win' ? 1 : 0),
        losses: currentStats.losses + (result === 'loss' ? 1 : 0),
        ties: currentStats.ties + (result === 'tie' ? 1 : 0),
        total_games: currentStats.total_games + 1,
        last_played: currentTime
      };
      
      await db.update(sessionStatsTable)
        .set(updatedStats)
        .where(eq(sessionStatsTable.session_id, input.session_id))
        .execute();
        
      sessionStats = {
        session_id: input.session_id,
        ...updatedStats
      };
    }
    
    // 5. Return the round result along with updated session stats
    return {
      player_choice: input.player_choice,
      computer_choice: computerChoice,
      result: result,
      session_stats: sessionStats
    };
  } catch (error) {
    console.error('Play round failed:', error);
    throw error;
  }
}