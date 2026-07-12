/**
 * Core domain types for Blackjack.
 *
 * Why not inline these types in the logic files? A single source of truth for
 * the domain model makes it easy for UI and game rules to share the same shape
 * without creating circular imports.
 */

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'

export type Rank =
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'

export interface Card {
  suit: Suit
  rank: Rank
}

export type GamePhase =
  | 'playerTurn' // Waiting for the player to hit or stand.
  | 'dealerTurn' // Player stood; dealer is drawing.
  | 'finished' // The round has a winner or is a push.

export type GameResult = 'playerWin' | 'dealerWin' | 'push' | null

export interface GameState {
  deck: Card[]
  playerHand: Card[]
  dealerHand: Card[]
  phase: GamePhase
  result: GameResult
}
