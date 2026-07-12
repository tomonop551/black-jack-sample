import { describe, expect, it } from 'bun:test'
import { handValue, isBlackjack, isBust } from './scoring'

// What: hand totals respect numeric cards, face cards, and flexible aces.
describe('handValue', () => {
  it('counts numbered cards at face value', () => {
    expect(handValue([{ suit: 'hearts', rank: '5' }])).toBe(5)
    expect(handValue([{ suit: 'hearts', rank: '10' }])).toBe(10)
  })

  it('counts face cards as 10', () => {
    expect(handValue([{ suit: 'clubs', rank: 'J' }])).toBe(10)
    expect(handValue([{ suit: 'diamonds', rank: 'Q' }])).toBe(10)
    expect(handValue([{ suit: 'spades', rank: 'K' }])).toBe(10)
  })

  it('counts ace as 11 when it does not bust the hand', () => {
    expect(handValue([{ suit: 'hearts', rank: 'A' }])).toBe(11)
  })

  it('counts ace as 1 when 11 would bust the hand', () => {
    expect(
      handValue([
        { suit: 'hearts', rank: 'A' },
        { suit: 'clubs', rank: 'K' },
        { suit: 'diamonds', rank: '9' },
      ]),
    ).toBe(20)
  })

  it('counts multiple aces correctly', () => {
    expect(
      handValue([
        { suit: 'hearts', rank: 'A' },
        { suit: 'diamonds', rank: 'A' },
        { suit: 'clubs', rank: '9' },
      ]),
    ).toBe(21)
  })
})

// What: a bust hand has a value greater than 21.
describe('isBust', () => {
  it('returns true for hands over 21', () => {
    expect(
      isBust([
        { suit: 'hearts', rank: '10' },
        { suit: 'diamonds', rank: '9' },
        { suit: 'clubs', rank: '5' },
      ]),
    ).toBe(true)
  })

  it('returns false for hands at or under 21', () => {
    expect(isBust([{ suit: 'hearts', rank: 'A' }])).toBe(false)
    expect(
      isBust([
        { suit: 'hearts', rank: 'A' },
        { suit: 'diamonds', rank: 'K' },
      ]),
    ).toBe(false)
  })
})

// What: a blackjack is exactly two cards totaling 21.
describe('isBlackjack', () => {
  it('returns true for an ace and a ten-value card', () => {
    expect(
      isBlackjack([
        { suit: 'hearts', rank: 'A' },
        { suit: 'spades', rank: 'Q' },
      ]),
    ).toBe(true)
  })

  it('returns false for non-blackjack hands', () => {
    expect(
      isBlackjack([
        { suit: 'hearts', rank: 'A' },
        { suit: 'spades', rank: 'Q' },
        { suit: 'clubs', rank: '9' },
      ]),
    ).toBe(false)
  })
})
