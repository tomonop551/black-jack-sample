import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Hand } from '../components/Hand'
import {
  type GameResult,
  type GameState,
  handValue,
  playerHit,
  playerStand,
  startNewGame,
} from '../lib/blackjack'

// Why not use TanStack Start server functions for game state? The entire game
// fits in the browser and needs no secrets or persistence, so keeping it on the
// client removes network latency and simplifies deployment.
export const Route = createFileRoute('/')({
  component: BlackjackPage,
})

function BlackjackPage() {
  // Start with a fresh shuffled deck on first render.
  const [game, setGame] = useState<GameState>(() => startNewGame())

  // Why not derive message inside the render directly? A small helper keeps the
  // JSX focused on structure and makes the wording easy to adjust in one place.
  const resultText = formatResult(game.result)

  return (
    <main
      style={{
        maxWidth: '48rem',
        margin: '0 auto',
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1>Blackjack</h1>

      <section aria-label="Dealer hand">
        <h2>Dealer</h2>
        <Hand cards={game.dealerHand} hideSecondCard={game.phase !== 'finished'} />
        {game.phase === 'finished' && (
          <p>Total: {handValue(game.dealerHand)}</p>
        )}
      </section>

      <section aria-label="Player hand">
        <h2>Player</h2>
        <Hand cards={game.playerHand} hideSecondCard={false} />
        <p>Total: {handValue(game.playerHand)}</p>
      </section>

      <p aria-live="polite" style={{ fontWeight: 'bold', minHeight: '1.5rem' }}>
        {resultText}
      </p>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setGame((current) => playerHit(current))}
          disabled={game.phase !== 'playerTurn'}
        >
          Hit
        </button>
        <button
          type="button"
          onClick={() => setGame((current) => playerStand(current))}
          disabled={game.phase !== 'playerTurn'}
        >
          Stand
        </button>
        <button
          type="button"
          onClick={() => setGame(startNewGame())}
        >
          New Game
        </button>
      </div>
    </main>
  )
}

// Why not store the message in state? Deriving it from the result keeps the
// GameState small and guarantees the UI text matches the current outcome.
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
