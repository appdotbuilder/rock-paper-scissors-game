import { serial, text, pgTable, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';

// Enums for game choices and results
export const gameChoiceEnum = pgEnum('game_choice', ['rock', 'paper', 'scissors']);
export const gameResultEnum = pgEnum('game_result', ['win', 'loss', 'tie']);

// Game rounds table - stores individual game rounds
export const gameRoundsTable = pgTable('game_rounds', {
  id: serial('id').primaryKey(),
  session_id: text('session_id').notNull(),
  player_choice: gameChoiceEnum('player_choice').notNull(),
  computer_choice: gameChoiceEnum('computer_choice').notNull(),
  result: gameResultEnum('result').notNull(),
  played_at: timestamp('played_at').defaultNow().notNull(),
});

// Session statistics table - tracks aggregated stats per session
export const sessionStatsTable = pgTable('session_stats', {
  session_id: text('session_id').primaryKey(),
  wins: integer('wins').notNull().default(0),
  losses: integer('losses').notNull().default(0),
  ties: integer('ties').notNull().default(0),
  total_games: integer('total_games').notNull().default(0),
  last_played: timestamp('last_played'),
});

// TypeScript types for the table schemas
export type GameRound = typeof gameRoundsTable.$inferSelect; // For SELECT operations
export type NewGameRound = typeof gameRoundsTable.$inferInsert; // For INSERT operations

export type SessionStats = typeof sessionStatsTable.$inferSelect; // For SELECT operations
export type NewSessionStats = typeof sessionStatsTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { 
  gameRounds: gameRoundsTable,
  sessionStats: sessionStatsTable
};