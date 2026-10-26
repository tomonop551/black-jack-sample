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

// Why not a shrinking stack of undealt cards? The reshuffle must recycle
// every card, so the shoe holds the full shuffled set and a `dealt` pointer;
// `cutIndex` marks the dealt count at which the cut card has been passed.
export interface Shoe {
  cards: Card[]
  dealt: number
  cutIndex: number
}

export interface GameState {
  deck: Card[]
  // Present when the round deals from the persistent shoe; absent for a
  // round started from an injected deck.
  shoe?: Shoe
  playerHand: Card[]
  dealerHand: Card[]
  phase: GamePhase
  result: GameResult
}
