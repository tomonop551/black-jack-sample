import { useState } from 'react'
import { MIN_BET } from '../lib/profile'

const CHIP_PRESETS = [10, 25, 50, 100] as const

// Encapsulates stake selection so the page only sees a single onDeal(bet).
export function BetControls({
  chips,
  initialBet,
  onDeal,
  onRebuy,
}: {
  chips: number
  initialBet: number
  onDeal: (bet: number) => void
  onRebuy: () => void
}) {
  const [selected, setSelected] = useState(() => Math.min(initialBet, chips))
  const bet = Math.min(selected, chips)

  if (chips < MIN_BET) {
    return (
      <section aria-label="Out of chips" style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
          Out of chips. Rebuy for a fresh stake?
        </p>
        <button type="button" onClick={onRebuy} style={dealButtonStyle}>
          Rebuy
        </button>
      </section>
    )
  }

  return (
    <section aria-label="Place your bet" style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', opacity: 0.9 }}>
        Place your bet
      </h2>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.75rem',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
        }}
      >
        {CHIP_PRESETS.map((amount) => (
          <ChipButton
            key={amount}
            label={String(amount)}
            active={bet === amount}
            disabled={amount > chips}
            onClick={() => setSelected(amount)}
          />
        ))}
        <ChipButton
          label="All In"
          active={bet === chips && !CHIP_PRESETS.includes(chips as (typeof CHIP_PRESETS)[number])}
          disabled={false}
          onClick={() => setSelected(chips)}
        />
      </div>
      <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Bet: {bet}
      </p>
      <button type="button" onClick={() => onDeal(bet)} style={dealButtonStyle}>
        Deal
      </button>
    </section>
  )
}

function ChipButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string
  active: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      style={{
        width: '3.5rem',
        height: '3.5rem',
        borderRadius: '50%',
        border: `0.25rem dashed ${active ? '#fbbf24' : 'rgba(255,255,255,0.6)'}`,
        backgroundColor: active ? '#b45309' : '#374151',
        color: '#ffffff',
        fontSize: '0.875rem',
        fontWeight: 'bold',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transform: active ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 0.1s ease',
      }}
    >
      {label}
    </button>
  )
}

const dealButtonStyle = {
  padding: '0.75rem 2.5rem',
  borderRadius: '0.5rem',
  border: 'none',
  backgroundColor: '#16a34a',
  color: '#ffffff',
  fontSize: '1.125rem',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
  cursor: 'pointer',
} as const
