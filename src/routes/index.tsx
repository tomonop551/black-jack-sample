import { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import confetti from 'canvas-confetti'
import { Hand } from '../components/Hand'
import {
  type GameResult,
  type GameState,
  handValue,
  playerHit,
  playerStand,
  startNewGame,
} from '../lib/blackjack'

export const Route = createFileRoute('/')({
  component: BlackjackPage,
})

function BlackjackPage() {
  const [game, setGame] = useState<GameState>(() => startNewGame())
  const previousResult = useRef<GameResult>(null)
  const resultText = formatResult(game.result)

  // Fire confetti once when the player wins, but not on every render of a win.
  useEffect(() => {
    if (game.result === 'playerWin' && previousResult.current !== 'playerWin') {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      })
    }
    previousResult.current = game.result
  }, [game.result])

  return (
    <main
      style={{
        maxWidth: '48rem',
        margin: '0 auto',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
        Blackjack
      </h1>

      <section aria-label="Dealer hand" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', opacity: 0.9 }}>Dealer</h2>
        <Hand cards={game.dealerHand} hideSecondCard={game.phase !== 'finished'} />
        {game.phase === 'finished' && (
          <p style={{ marginTop: '0.75rem', fontSize: '1.125rem' }}>
            Total: {handValue(game.dealerHand)}
          </p>
        )}
      </section>

      <section aria-label="Player hand" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', opacity: 0.9 }}>Player</h2>
        <Hand cards={game.playerHand} hideSecondCard={false} />
        <p style={{ marginTop: '0.75rem', fontSize: '1.125rem' }}>
          Total: {handValue(game.playerHand)}
        </p>
      </section>

      <p
        aria-live="polite"
        style={{
          minHeight: '2rem',
          marginBottom: '1.5rem',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        }}
      >
        {resultText}
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <ActionButton
          label="Hit"
          color="#2563eb"
          onClick={() => setGame((current) => playerHit(current))}
          disabled={game.phase !== 'playerTurn'}
        />
        <ActionButton
          label="Stand"
          color="#dc2626"
          onClick={() => setGame((current) => playerStand(current))}
          disabled={game.phase !== 'playerTurn'}
        />
        <ActionButton
          label="New Game"
          color="#d97706"
          onClick={() => setGame(startNewGame())}
          disabled={false}
        />
      </div>
    </main>
  )
}

function ActionButton({
  label,
  color,
  onClick,
  disabled,
}: {
  label: string
  color: string
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '5.5rem',
        height: '5.5rem',
        borderRadius: '50%',
        border: '0.375rem dashed rgba(255,255,255,0.6)',
        backgroundColor: color,
        color: '#ffffff',
        fontSize: '1rem',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'transform 0.1s ease, box-shadow 0.1s ease',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(1.05)'
          e.currentTarget.style.boxShadow = '0 6px 8px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2)'
      }}
      onMouseDown={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(0.95)'
        }
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)'
      }}
    >
      {label}
    </button>
  )
}

function formatResult(result: GameResult): string {
  switch (result) {
    case 'playerWin':
      return 'You win!'
    case 'dealerWin':
      return 'Dealer wins.'
    case 'push':
      return 'Push.'
    default:
      return ''
  }
}
