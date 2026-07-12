import { describe, expect, it } from 'bun:test'
import type { Card } from './types'
import { createDeck, shuffleDeck } from './deck'

// What: a standard deck contains 52 unique cards.
describe('createDeck', () => {
  it('returns 52 cards', () => {
    const deck = createDeck()
    expect(deck.length).toBe(52)
  })

  it('contains every suit and rank combination', () => {
    const deck = createDeck()
    const suits = new Set(deck.map((card) => card.suit))
    const ranks = new Set(deck.map((card) => card.rank))

    expect(suits.size).toBe(4)
    expect(ranks.size).toBe(13)
  })
})

// What: shuffling reorders the deck without changing its contents.
describe('shuffleDeck', () => {
  it('keeps the same 52 cards after shuffling', () => {
    const deck = createDeck()
    const shuffled = shuffleDeck(deck)

    expect(shuffled.length).toBe(52)

    const byRankThenSuit = (a: Card, b: Card) =>
      a.rank.localeCompare(b.rank) || a.suit.localeCompare(b.suit)

    expect(shuffled.toSorted(byRankThenSuit)).toEqual(deck.toSorted(byRankThenSuit))
  })
})
