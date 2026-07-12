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
        justifyContent: 'center',
        gap: '0.75rem',
        listStyle: 'none',
        padding: 0,
        margin: 0,
      }}
    >
      {cards.map((card, index) => {
        const hidden = hideSecondCard && index === 1
        return (
          <li
            key={`${card.suit}-${card.rank}-${index}`}
            style={{
              width: '4.5rem',
              height: '6.75rem',
              borderRadius: '0.625rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: hidden
                ? 'repeating-linear-gradient(45deg, #1f2937, #1f2937 0.5rem, #111827 0.5rem, #111827 1rem)'
                : '#ffffff',
              color: hidden ? '#ffffff' : suitColor(card.suit),
              fontSize: '1.5rem',
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
              border: hidden ? '0.125rem solid #374151' : '0.125rem solid #e5e7eb',
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

function suitColor(suit: Card['suit']): string {
  return suit === 'hearts' || suit === 'diamonds' ? '#dc2626' : '#111827'
}
