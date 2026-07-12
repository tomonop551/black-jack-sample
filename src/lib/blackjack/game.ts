import { shuffleDeck, createDeck } from './deck'
import { handValue, isBlackjack, isBust } from './scoring'
import type { Card, GameState } from './types'

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
): Exclude<GameState['result'], null> {
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
