import { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import confetti from 'canvas-confetti'
import { Hand } from '../components/Hand'
import { BetControls } from '../components/BetControls'
import {
  type GameResult,
  type GameState,
  handValue,
  isBlackjack,
  playerHit,
  playerStand,
  startNewGame,
} from '../lib/blackjack'
import {
  type PlayerProfile,
  chipDelta,
  useProfile,
  useRebuy,
  useRecordResult,
  winRate,
} from '../lib/profile'

export const Route = createFileRoute('/')({
  component: BlackjackPage,
})

function BlackjackPage() {
  const profileQuery = useProfile()
  const { mutate: recordResult } = useRecordResult()
  const { mutate: rebuy } = useRebuy()

  // game === null means the player is placing a bet, not mid-round.
  const [game, setGame] = useState<GameState | null>(null)
  const [bet, setBet] = useState<number | null>(null)
  const previousResult = useRef<GameResult>(null)
  const settledGame = useRef<GameState | null>(null)

  const result = game?.result ?? null
  const playerHasBlackjack = game !== null && isBlackjack(game.playerHand)

  // Why settle in an effect instead of the click handlers? Results can also
  // be decided by the initial deal, and an effect sees every transition.
  // The ref guard keeps StrictMode's double invocation from recording twice.
  useEffect(() => {
    if (!game || game.phase !== 'finished' || !game.result || bet === null) return
    if (settledGame.current === game) return
    settledGame.current = game

    recordResult({ result: game.result, bet, playerBlackjack: isBlackjack(game.playerHand) })
  }, [game, bet, recordResult])

  // Fire confetti once when the player wins, but not on every render of a win.
  useEffect(() => {
    if (result === 'playerWin' && previousResult.current !== 'playerWin') {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      })
    }
    previousResult.current = result
  }, [result])

  if (profileQuery.isPending) {
    return <main style={pageStyle}>Loading table...</main>
  }

  if (profileQuery.isError) {
    return <main style={pageStyle}>Failed to load your chips. Please reload.</main>
  }

  const profile = profileQuery.data

  return (
    <main style={pageStyle}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
        Blackjack
      </h1>

      <StatsBar profile={profile} />

      {game === null ? (
        <BetControls
          chips={profile.chips}
          initialBet={profile.lastBet}
          onDeal={(amount) => {
            setBet(amount)
            setGame(startNewGame())
          }}
          onRebuy={() => rebuy()}
        />
      ) : (
        <>
          <p style={{ marginBottom: '2rem', fontSize: '1.125rem', opacity: 0.9 }}>
            Bet: {bet}
          </p>

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
            {formatResult(result, bet, playerHasBlackjack)}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {game.phase === 'finished' ? (
              <ActionButton
                label="Next Round"
                color="#d97706"
                onClick={() => {
                  setGame(null)
                  setBet(null)
                }}
                disabled={false}
              />
            ) : (
              <>
                <ActionButton
                  label="Hit"
                  color="#2563eb"
                  onClick={() => setGame((current) => (current ? playerHit(current) : current))}
                  disabled={game.phase !== 'playerTurn'}
                />
                <ActionButton
                  label="Stand"
                  color="#dc2626"
                  onClick={() => setGame((current) => (current ? playerStand(current) : current))}
                  disabled={game.phase !== 'playerTurn'}
                />
              </>
            )}
          </div>
        </>
      )}
    </main>
  )
}

const pageStyle = {
  maxWidth: '48rem',
  margin: '0 auto',
  padding: '2rem',
  textAlign: 'center',
} as const

function StatsBar({ profile }: { profile: PlayerProfile }) {
  const { stats } = profile
  const items: Array<[string, string]> = [
    ['Chips', String(profile.chips)],
    ['Record', `${stats.wins}-${stats.losses}-${stats.pushes}`],
    ['Win rate', `${Math.round(winRate(profile) * 100)}%`],
    ['Blackjacks', String(stats.blackjacks)],
  ]

  return (
    <dl
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '2rem',
        flexWrap: 'wrap',
        margin: '0 0 2rem',
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        backgroundColor: 'rgba(0,0,0,0.25)',
      }}
    >
      {items.map(([label, value]) => (
        <div key={label} style={{ textAlign: 'center' }}>
          <dt style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7 }}>
            {label}
          </dt>
          <dd style={{ margin: 0, fontSize: '1.125rem', fontWeight: 'bold' }}>{value}</dd>
        </div>
      ))}
    </dl>
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
        minWidth: '5.5rem',
        height: '5.5rem',
        padding: '0 0.75rem',
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

function formatResult(result: GameResult, bet: number | null, playerBlackjack: boolean): string {
  if (result === null || bet === null) return ''
  const delta = chipDelta(result, bet, playerBlackjack)
  const suffix = delta > 0 ? ` +${delta}` : delta < 0 ? ` ${delta}` : ''

  switch (result) {
    case 'playerWin':
      return playerBlackjack ? `Blackjack!${suffix}` : `You win!${suffix}`
    case 'dealerWin':
      return `Dealer wins.${suffix}`
    case 'push':
      return 'Push.'
  }
}
