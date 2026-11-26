import { describe, expect, it } from 'bun:test'
import type { Card } from '../lib/blackjack'
import { FACE_DOWN_LABEL, cardName, dealerRevealAnnouncement } from './cardLabels'

// What: every card exposes a human-readable name built from spoken rank words.
describe('cardName', () => {
  it('names an ace with the suit word', () => {
    expect(cardName({ suit: 'hearts', rank: 'A' })).toBe('Ace of hearts')
  })

  it('spells numbered ranks as words', () => {
    expect(cardName({ suit: 'clubs', rank: '10' })).toBe('Ten of clubs')
    expect(cardName({ suit: 'spades', rank: '2' })).toBe('Two of spades')
  })

  it('names court cards with their rank word', () => {
    expect(cardName({ suit: 'diamonds', rank: 'J' })).toBe('Jack of diamonds')
    expect(cardName({ suit: 'hearts', rank: 'Q' })).toBe('Queen of hearts')
    expect(cardName({ suit: 'spades', rank: 'K' })).toBe('King of spades')
  })

  it('produces a name for every card in a fresh deck', () => {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'] as const
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const
    for (const suit of suits) {
      for (const rank of ranks) {
        const card: Card = { suit, rank }
        expect(cardName(card)).toMatch(/^(\w+) of (hearts|diamonds|clubs|spades)$/)
      }
    }
  })
})

// What: the face-down card has its own stable label.
describe('FACE_DOWN_LABEL', () => {
  it('announces the card as face-down rather than as a missing card', () => {
    expect(FACE_DOWN_LABEL).toBe('Face-down card')
  })
})

// What: the reveal message names the dealer's hole card and final total.
describe('dealerRevealAnnouncement', () => {
  it('names the second card and sums the hand', () => {
    expect(
      dealerRevealAnnouncement([
        { suit: 'clubs', rank: '6' },
        { suit: 'hearts', rank: 'K' },
      ]),
    ).toBe('Dealer reveals King of hearts. Total 16.')
  })

  it('includes extra hit cards in the total', () => {
    expect(
      dealerRevealAnnouncement([
        { suit: 'spades', rank: '7' },
        { suit: 'diamonds', rank: '9' },
        { suit: 'clubs', rank: 'A' },
      ]),
    ).toBe('Dealer reveals Nine of diamonds. Total 17.')
  })
})
