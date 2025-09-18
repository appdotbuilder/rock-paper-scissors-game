import { z } from 'zod';

// Game choice enum
export const gameChoiceSchema = z.enum(['rock', 'paper', 'scissors']);
export type GameChoice = z.infer<typeof gameChoiceSchema>;

// Game result enum
export const gameResultSchema = z.enum(['win', 'loss', 'tie']);
export type GameResult = z.infer<typeof gameResultSchema>;

// Game round schema
export const gameRoundSchema = z.object({
  id: z.number(),
  session_id: z.string(),
  player_choice: gameChoiceSchema,
  computer_choice: gameChoiceSchema,
  result: gameResultSchema,
  played_at: z.coerce.date()
});

export type GameRound = z.infer<typeof gameRoundSchema>;

// Session statistics schema
export const sessionStatsSchema = z.object({
  session_id: z.string(),
  wins: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  ties: z.number().int().nonnegative(),
  total_games: z.number().int().nonnegative(),
  last_played: z.coerce.date().nullable()
});

export type SessionStats = z.infer<typeof sessionStatsSchema>;

// Input schema for playing a round
export const playRoundInputSchema = z.object({
  session_id: z.string(),
  player_choice: gameChoiceSchema
});

export type PlayRoundInput = z.infer<typeof playRoundInputSchema>;

// Response schema for playing a round
export const playRoundResponseSchema = z.object({
  player_choice: gameChoiceSchema,
  computer_choice: gameChoiceSchema,
  result: gameResultSchema,
  session_stats: sessionStatsSchema
});

export type PlayRoundResponse = z.infer<typeof playRoundResponseSchema>;

// Input schema for getting session stats
export const getSessionStatsInputSchema = z.object({
  session_id: z.string()
});

export type GetSessionStatsInput = z.infer<typeof getSessionStatsInputSchema>;

// Input schema for resetting session
export const resetSessionInputSchema = z.object({
  session_id: z.string()
});

export type ResetSessionInput = z.infer<typeof resetSessionInputSchema>;