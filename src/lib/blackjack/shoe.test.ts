import { describe, expect, it } from 'bun:test'
import type { Card, Rank, Shoe, Suit } from './types'
import {
  DEFAULT_DECK_COUNT,
  DECK_SIZE,
  MIN_CARDS_TO_DEAL,
  createShoe,
  cutCardIndex,
  needsReshuffle,
  remainingCards,
  reshuffleShoe,
  settleShoe,
  undealtCards,
} from './shoe'

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

// Position-only shoe; card identity does not matter for threshold tests.
function syntheticShoe(totalCards: number, dealt = 0, cutIndex = totalCards): Shoe {
  const cards: Card[] = Array.from({ length: totalCards }, (_, i) => ({
    suit: SUITS[i % SUITS.length],
    rank: RANKS[i % RANKS.length],
  }))
  return { cards, dealt, cutIndex }
}

function serialize(card: Card): string {
  return `${card.suit}:${card.rank}`
}

// What: createShoe builds a shuffled multi-deck set with the cut placed at
// the requested penetration.
describe('createShoe', () => {
  it('holds deckCount full decks of cards', () => {
    const shoe = createShoe(3)

    expect(shoe.cards.length).toBe(3 * DECK_SIZE)
  })

  it('defaults to six decks', () => {
    const shoe = createShoe()

    expect(shoe.cards.length).toBe(DEFAULT_DECK_COUNT * DECK_SIZE)
  })

  it('contains deckCount copies of every rank-suit pair', () => {
    const shoe = createShoe()
    const counts = new Map<string, number>()
    for (const card of shoe.cards) {
      counts.set(serialize(card), (counts.get(serialize(card)) ?? 0) + 1)
    }

    expect(counts.size).toBe(DECK_SIZE)
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        expect(counts.get(`${suit}:${rank}`)).toBe(DEFAULT_DECK_COUNT)
      }
    }
  })

  it('places the cut card at roughly 75% penetration by default', () => {
    const shoe = createShoe()

    expect(shoe.cutIndex).toBe(234)
    expect(shoe.dealt).toBe(0)
  })

  it('starts with a fresh position regardless of penetration', () => {
    const shoe = createShoe(1, 0.5)

    expect(shoe.dealt).toBe(0)
    expect(shoe.cutIndex).toBe(26)
  })
})

// What: cutCardIndex floors the penetration against the shoe size.
describe('cutCardIndex', () => {
  it('floors penetration times total', () => {
    expect(cutCardIndex(0.75, 312)).toBe(234)
    expect(cutCardIndex(0.75, 101)).toBe(75)
    expect(cutCardIndex(0.5, 52)).toBe(26)
  })

  it('defaults to six decks at 75% penetration', () => {
    expect(cutCardIndex()).toBe(cutCardIndex(0.75, DEFAULT_DECK_COUNT * DECK_SIZE))
  })
})

// What: the reshuffle check trips on the cut card, not on exhaustion.
describe('needsReshuffle', () => {
  it('is false while the cut card is still ahead', () => {
    expect(needsReshuffle(syntheticShoe(312, 233, 234))).toBe(false)
  })

  it('is true as soon as the dealt count reaches the cut', () => {
    expect(needsReshuffle(syntheticShoe(312, 234, 234))).toBe(true)
    expect(needsReshuffle(syntheticShoe(312, 300, 234))).toBe(true)
  })

  it('is true when fewer than the minimum deal remain even before the cut', () => {
    const shoe = syntheticShoe(10, 10 - (MIN_CARDS_TO_DEAL - 1), 10)

    expect(remainingCards(shoe)).toBe(MIN_CARDS_TO_DEAL - 1)
    expect(needsReshuffle(shoe)).toBe(true)
  })
})

// What: reshuffling recycles every card — dealt and undealt together —
// and resets the position for a new cut cycle.
describe('reshuffleShoe', () => {
  it('keeps the exact multiset of cards and resets the position', () => {
    const shoe = syntheticShoe(100, 40, 75)
    const next = reshuffleShoe(shoe)

    expect(next.cards).not.toBe(shoe.cards)
    expect(next.cards.length).toBe(shoe.cards.length)
    expect([...next.cards].map(serialize).sort()).toEqual([...shoe.cards].map(serialize).sort())
    expect(next.dealt).toBe(0)
    expect(next.cutIndex).toBe(shoe.cutIndex)
  })

  it('leaves the input shoe untouched', () => {
    const shoe = syntheticShoe(52, 10, 39)
    reshuffleShoe(shoe)

    expect(shoe.dealt).toBe(10)
    expect(shoe.cards.length).toBe(52)
  })
})

// What: the undealt view is the cards after the dealt pointer.
describe('undealtCards', () => {
  it('skips exactly the dealt cards', () => {
    const shoe = syntheticShoe(8, 2, 8)
    const view = undealtCards(shoe)

    expect(view.length).toBe(6)
    expect(view[0]).toBe(shoe.cards[2])
  })
})

// What: settling a round converts the round's leftover view back into a
// dealt position, because the round consumed a contiguous head slice.
describe('settleShoe', () => {
  it('advances the dealt pointer by the cards the view lost', () => {
    const shoe = syntheticShoe(312, 100, 234)
    const viewAfterRound = undealtCards(shoe).slice(0, undealtCards(shoe).length - 6)
    const next = settleShoe(shoe, viewAfterRound)

    expect(next.dealt).toBe(106)
    expect(next.cards).toBe(shoe.cards)
    expect(next.cutIndex).toBe(shoe.cutIndex)
  })

  it('leaves the input shoe untouched', () => {
    const shoe = syntheticShoe(52, 0, 39)
    settleShoe(shoe, shoe.cards.slice(4))

    expect(shoe.dealt).toBe(0)
  })
})
