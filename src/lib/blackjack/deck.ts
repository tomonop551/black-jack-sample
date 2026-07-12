import type { Card, Rank, Suit } from './types'

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
