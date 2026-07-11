/**
 * Blackjack domain model and game logic.
 *
 * This module exposes pure functions that describe how a game of Blackjack
 * progresses from a fresh deal to a final result. It keeps all state in plain
 * objects so the React UI can re-render by replacing the game snapshot.
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

// Why not use a constant literal for the deck? Generating it with loops keeps
// the source small and makes it obvious that every rank is paired with every suit.
export function createDeck(): Card[] {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
  const deck: Card[] = []

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank })
    }
  }

  return deck
}

// Why not use Math.random() directly inside the game functions? Separating the
// shuffle lets tests inject a deterministic deck and avoids hidden RNG state.
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck]

  // Fisher-Yates shuffle: swap each card with a random earlier or current card.
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled
}

// Why not store the numeric value on each card? Computing it from the rank keeps
// the Card type serializable and avoids duplicating the ace rule in two places.
function rankValue(rank: Rank): number {
  if (rank === 'A') return 11
  if (rank === 'J' || rank === 'Q' || rank === 'K') return 10
  return Number.parseInt(rank, 10)
}

// Why not store a running hand total? Aces have two legal values, so the total
// is derived from the cards each time it is needed.
export function handValue(hand: Card[]): number {
  let total = 0
  let aces = 0

  for (const card of hand) {
    total += rankValue(card.rank)
    if (card.rank === 'A') aces += 1
  }

  // Convert aces from 11 to 1 while the hand is busted.
  while (total > 21 && aces > 0) {
    total -= 10
    aces -= 1
  }

  return total
}

export function isBust(hand: Card[]): boolean {
  return handValue(hand) > 21
}

export function isBlackjack(hand: Card[]): boolean {
  return hand.length === 2 && handValue(hand) === 21
}

// Why not split dealing into separate functions? A single deal function produces
// a valid initial state in one call and removes four cards from the deck atomically.
export function dealInitialHands(deck: Card[]): {
  deck: Card[]
  playerHand: Card[]
  dealerHand: Card[]
} {
  if (deck.length < 4) {
    throw new Error('Not enough cards to deal')
  }

  // Deal cards in alternating order: player, dealer, player, dealer.
  const playerHand: Card[] = [deck[0], deck[2]]
  const dealerHand: Card[] = [deck[1], deck[3]]
  const remainingDeck = deck.slice(4)

  return { deck: remainingDeck, playerHand, dealerHand }
}

// Why not mutate the input state? Returning a new state makes every transition
// predictable and works well with React's immutable update pattern.
export function startNewGame(deck?: Card[]): GameState {
  const initialDeck = deck ?? shuffleDeck(createDeck())
  const { deck: remainingDeck, playerHand, dealerHand } = dealInitialHands(initialDeck)

  const state: GameState = {
    deck: remainingDeck,
    playerHand,
    dealerHand,
    phase: 'playerTurn',
    result: null,
  }

  // Check for immediate blackjacks before the player takes any action.
  if (isBlackjack(playerHand) || isBlackjack(dealerHand)) {
    return finishRound(state)
  }

  return state
}

// Why not let the UI handle bust detection? Centralizing the win logic here
// guarantees that the dealer and player are evaluated by the same rules.
export function determineResult(
  playerHand: Card[],
  dealerHand: Card[],
): Exclude<GameResult, null> {
  const playerTotal = handValue(playerHand)
  const dealerTotal = handValue(dealerHand)
  const playerBust = playerTotal > 21
  const dealerBust = dealerTotal > 21

  if (playerBust) return 'dealerWin'
  if (dealerBust) return 'playerWin'
  if (playerTotal > dealerTotal) return 'playerWin'
  if (dealerTotal > playerTotal) return 'dealerWin'
  return 'push'
}

function finishRound(state: GameState): GameState {
  return {
    ...state,
    phase: 'finished',
    result: determineResult(state.playerHand, state.dealerHand),
  }
}

// Why not allow hitting after the round is over? A strict phase check prevents
// accidental state transitions and surfaces misuse in tests immediately.
export function playerHit(state: GameState): GameState {
  if (state.phase !== 'playerTurn') {
    throw new Error('Cannot hit outside of player turn')
  }

  if (state.deck.length === 0) {
    throw new Error('The deck is empty')
  }

  const [drawnCard, ...remainingDeck] = state.deck
  const nextState: GameState = {
    ...state,
    deck: remainingDeck,
    playerHand: [...state.playerHand, drawnCard],
  }

  if (isBust(nextState.playerHand)) {
    return finishRound(nextState)
  }

  return nextState
}

// Why not stop the dealer on a soft 17? Standing on hard 17 or higher is the
// most common house rule and keeps the implementation simple.
export function playerStand(state: GameState): GameState {
  if (state.phase !== 'playerTurn') {
    throw new Error('Cannot stand outside of player turn')
  }

  let nextState: GameState = { ...state, phase: 'dealerTurn' }

  while (handValue(nextState.dealerHand) < 17 && nextState.deck.length > 0) {
    const [drawnCard, ...remainingDeck] = nextState.deck
    nextState = {
      ...nextState,
      deck: remainingDeck,
      dealerHand: [...nextState.dealerHand, drawnCard],
    }
  }

  return finishRound(nextState)
}
