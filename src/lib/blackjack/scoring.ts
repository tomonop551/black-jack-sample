import type { Card, Rank } from './types'

// Compute value from rank so Card stays a plain serializable object.
function rankValue(rank: Rank): number {
  if (rank === 'A') return 11
  if (rank === 'J' || rank === 'Q' || rank === 'K') return 10
  return Number.parseInt(rank, 10)
}

// Recompute the total each time because aces can count as 1 or 11.
export function handValue(hand: Card[]): number {
  let total = 0
  let aces = 0

  for (const card of hand) {
    total += rankValue(card.rank)
    if (card.rank === 'A') aces += 1
  }

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
