import type { Card } from '../lib/blackjack'

// Encapsulates hole-card hiding and card styling so pages do not repeat it.
export function Hand({
  cards,
  hideSecondCard,
}: {
  cards: Card[]
  hideSecondCard: boolean
}) {
  return (
    <ul
      style={{
        display: 'flex',
        gap: '0.5rem',
        listStyle: 'none',
        padding: 0,
      }}
    >
      {cards.map((card, index) => {
        const hidden = hideSecondCard && index === 1
        return (
          <li
            key={`${card.suit}-${card.rank}-${index}`}
            style={{
              width: '4rem',
              height: '6rem',
              border: '1px solid #333',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: hidden ? '#444' : '#fff',
              color: hidden ? '#fff' : '#000',
              fontSize: '1.25rem',
            }}
          >
            {hidden ? '🂠' : `${card.rank}${suitSymbol(card.suit)}`}
          </li>
        )
      })}
    </ul>
  )
}

// Keep glyphs out of the Card type so logic files stay presentation-agnostic.
function suitSymbol(suit: Card['suit']): string {
  switch (suit) {
    case 'hearts':
      return '♥'
    case 'diamonds':
      return '♦'
    case 'clubs':
      return '♣'
    case 'spades':
      return '♠'
  }
}
