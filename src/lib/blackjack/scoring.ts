import type { Card, Rank } from './types'

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
