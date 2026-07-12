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

export type GamePhase = 'playerTurn' | 'dealerTurn' | 'finished'

export type GameResult = 'playerWin' | 'dealerWin' | 'push' | null

export interface GameState {
  deck: Card[]
  playerHand: Card[]
  dealerHand: Card[]
  phase: GamePhase
  result: GameResult
}
