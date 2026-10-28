import { useState } from 'react'
import { MIN_BET } from '../lib/profile'

const CHIP_PRESETS = [10, 25, 50, 100] as const

// Encapsulates stake selection so the page only sees a single onDeal(bet).
export function BetControls({
  chips,
  initialBet,
  onDeal,
  onRebuy,
  onReset,
}: {
  chips: number
  initialBet: number
  onDeal: (bet: number) => void
  onRebuy: () => void
  onReset: () => void
}) {
  const [selected, setSelected] = useState(() => Math.min(initialBet, chips))
  const bet = Math.min(selected, chips)

  // Why reset MIN_BET locally as well? The page re-renders with the fresh
  // profile, but `selected` is local state and would keep showing the old
  // stake on the chip row after a reset.
  const handleReset = () => {
    setSelected(MIN_BET)
    onReset()
  }

  if (chips < MIN_BET) {
    return (
      <section aria-label="Out of chips" style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
          Out of chips. Rebuy for a fresh stake?
        </p>
        <button type="button" onClick={onRebuy} style={dealButtonStyle}>
          Rebuy
        </button>
        <ResetControl onConfirm={handleReset} />
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
      <ResetControl onConfirm={handleReset} />
    </section>
  )
}

// Two-step inline confirmation: a single stray tap must never erase a
// session. Why not window.confirm? It is unstyled, blocking, and hostile to
// mobile browsers, while this matches the table's look.
function ResetControl({ onConfirm }: { onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false)

  if (!confirming) {
    return (
      <p style={{ marginTop: '1rem' }}>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          style={resetLinkStyle}
        >
          Reset chips &amp; stats
        </button>
      </p>
    )
  }

  return (
    <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
      <span style={{ opacity: 0.85 }}>Erase all chips and stats? This cannot be undone.</span>{' '}
      <button
        type="button"
        onClick={() => {
          setConfirming(false)
          onConfirm()
        }}
        style={{ ...resetLinkStyle, color: '#f87171', fontWeight: 'bold' }}
      >
        Yes, reset
      </button>{' '}
      <button
        type="button"
        onClick={() => setConfirming(false)}
        style={resetLinkStyle}
      >
        Cancel
      </button>
    </p>
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

// Why not reuse the chip styling? Reset must read as a footnote next to
// Deal, so it stays a plain underlined text link instead of a button shape.
const resetLinkStyle = {
  background: 'none',
  border: 'none',
  padding: 0,
  color: 'rgba(255,255,255,0.6)',
  fontSize: '0.8rem',
  textDecoration: 'underline',
  cursor: 'pointer',
} as const
