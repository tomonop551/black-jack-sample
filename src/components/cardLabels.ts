import { handValue } from '../lib/blackjack'
import type { Card } from '../lib/blackjack'

// Why not reuse the on-screen glyphs (A♥ / 🂠) for the accessible name?
// Assistive tech voices them inconsistently ("black heart suit", unknown
// character), so screen-reader labels must be spelled-out words.
const RANK_WORDS: Record<Card['rank'], string> = {
  A: 'Ace',
  '2': 'Two',
  '3': 'Three',
  '4': 'Four',
  '5': 'Five',
  '6': 'Six',
  '7': 'Seven',
  '8': 'Eight',
  '9': 'Nine',
  '10': 'Ten',
  J: 'Jack',
  Q: 'Queen',
  K: 'King',
}

export const FACE_DOWN_LABEL = 'Face-down card'

export function cardName(card: Card): string {
  return `${RANK_WORDS[card.rank]} of ${card.suit}`
}

// Announce the revealed hole card and the final total in one breath so a
// screen-reader player learns what the dealer had without re-reading the list.
export function dealerRevealAnnouncement(dealerHand: Card[]): string {
  return `Dealer reveals ${cardName(dealerHand[1])}. Total ${handValue(dealerHand)}.`
}
