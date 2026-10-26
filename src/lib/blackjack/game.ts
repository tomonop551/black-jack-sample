import { shuffleDeck, createDeck } from './deck'
import { handValue, isBlackjack, isBust } from './scoring'
import { MIN_CARDS_TO_DEAL, needsReshuffle, reshuffleShoe, undealtCards } from './shoe'
import type { Card, GameState, Shoe } from './types'

// Deal player and dealer hands together so the deck is consumed atomically.
export function dealInitialHands(deck: Card[]): {
  deck: Card[]
  playerHand: Card[]
  dealerHand: Card[]
} {
  if (deck.length < MIN_CARDS_TO_DEAL) {
    throw new Error('Not enough cards to deal')
  }

  const playerHand: Card[] = [deck[0], deck[2]]
  const dealerHand: Card[] = [deck[1], deck[3]]
  const remainingDeck = deck.slice(4)

  return { deck: remainingDeck, playerHand, dealerHand }
}

// Return a new state on every transition to keep React updates predictable.
export function startNewGame(deck?: Card[]): GameState {
  const initialDeck = deck ?? shuffleDeck(createDeck())
  return initialRoundState(initialDeck)
}

// Start a round from the persistent shoe instead of a fresh deck. The
// reshuffle decision belongs here, at the round boundary: the cut card is
// allowed to come out mid-round (casinos finish the hand), but the next
// round starts from a full shoe, so a round can never run the shoe dry.
export function startRound(shoe: Shoe): GameState {
  const activeShoe = needsReshuffle(shoe) ? reshuffleShoe(shoe) : shoe
  return initialRoundState(undealtCards(activeShoe), activeShoe)
}

function initialRoundState(deck: Card[], shoe?: Shoe): GameState {
  const { deck: remainingDeck, playerHand, dealerHand } = dealInitialHands(deck)

  const state: GameState = {
    deck: remainingDeck,
    ...(shoe ? { shoe } : {}),
    playerHand,
    dealerHand,
    phase: 'playerTurn',
    result: null,
  }

  if (isBlackjack(playerHand) || isBlackjack(dealerHand)) {
    return finishRound(state)
  }

  return state
}

// Keep win evaluation in one place so both dealer and player use the same rules.
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

// Reject hits outside the player turn to prevent invalid state transitions.
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

// Dealer stands on hard 17 or higher; this matches the most common house rule.
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
