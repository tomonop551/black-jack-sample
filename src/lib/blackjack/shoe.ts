import type { Card, Shoe } from './types'
import { createDeck, shuffleDeck } from './deck'

export const DECK_SIZE = 52
export const DEFAULT_DECK_COUNT = 6
export const DEFAULT_PENETRATION = 0.75

// Cards an initial deal consumes; a shoe below this cannot start a round.
export const MIN_CARDS_TO_DEAL = 4

// Cut position as an index into the shuffled shoe: once this many cards have
// been dealt, the cut card has come out and the next boundary reshuffles.
// Why not derive it from `remainingCards` at call sites? Penetration is a
// fraction of the dealt side, so flooring here keeps the threshold stable
// across a cut cycle even though the view shrinks.
export function cutCardIndex(
  penetration: number = DEFAULT_PENETRATION,
  totalCards: number = DEFAULT_DECK_COUNT * DECK_SIZE,
): number {
  return Math.floor(totalCards * penetration)
}

export function createShoe(
  deckCount: number = DEFAULT_DECK_COUNT,
  penetration: number = DEFAULT_PENETRATION,
): Shoe {
  const combined: Card[] = []
  for (let i = 0; i < deckCount; i++) {
    combined.push(...createDeck())
  }

  const cards = shuffleDeck(combined)
  return { cards, dealt: 0, cutIndex: cutCardIndex(penetration, cards.length) }
}

export function remainingCards(shoe: Shoe): number {
  return shoe.cards.length - shoe.dealt
}

export function undealtCards(shoe: Shoe): Card[] {
  return shoe.cards.slice(shoe.dealt)
}

// Reshuffle on penetration (cut passed), not on exhaustion, so a round never
// draws from an empty deck. The low-remaining term is a safety net for
// synthetic shoes with an aggressive cut; a default shoe never reaches it.
export function needsReshuffle(shoe: Shoe): boolean {
  return shoe.dealt >= shoe.cutIndex || remainingCards(shoe) < MIN_CARDS_TO_DEAL
}

// Why not shuffle only the undealt cards? The dealt cards remain in `cards`,
// so recycling the full set keeps every card in play and preserves the cut
// index (total size is unchanged), which a shrinking stack could not.
export function reshuffleShoe(shoe: Shoe): Shoe {
  return { cards: shuffleDeck(shoe.cards), dealt: 0, cutIndex: shoe.cutIndex }
}

// A round consumes a contiguous head slice of `undealtCards`, so the number
// of dealt cards after the round is just how far the view shrank.
export function settleShoe(shoe: Shoe, remainingView: Card[]): Shoe {
  return { ...shoe, dealt: shoe.cards.length - remainingView.length }
}
