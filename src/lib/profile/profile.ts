import type { GameResult } from '../blackjack'
import type { PlayerProfile } from './types'

export const INITIAL_CHIPS = 1000
export const MIN_BET = 10

export function initialProfile(): PlayerProfile {
  return {
    chips: INITIAL_CHIPS,
    lastBet: MIN_BET,
    stats: { rounds: 0, wins: 0, losses: 0, pushes: 0, blackjacks: 0 },
  }
}

// Why not pay blackjack at even money? The traditional 3:2 payout is the
// main reason blackjack is beatable, so we keep it and floor odd fractions
// to keep chip counts integers.
export function chipDelta(result: Exclude<GameResult, null>, bet: number, playerBlackjack: boolean): number {
  switch (result) {
    case 'playerWin':
      return playerBlackjack ? Math.floor(bet * 1.5) : bet
    case 'dealerWin':
      return -bet
    case 'push':
      return 0
  }
}

// Return a new profile on every update so React Query cache writes stay immutable.
export function applyResult(
  profile: PlayerProfile,
  result: Exclude<GameResult, null>,
  bet: number,
  playerBlackjack: boolean,
): PlayerProfile {
  const stats = { ...profile.stats, rounds: profile.stats.rounds + 1 }
  if (result === 'playerWin') {
    stats.wins += 1
    if (playerBlackjack) stats.blackjacks += 1
  } else if (result === 'dealerWin') {
    stats.losses += 1
  } else {
    stats.pushes += 1
  }

  return {
    chips: profile.chips + chipDelta(result, bet, playerBlackjack),
    lastBet: bet,
    stats,
  }
}

export function winRate(profile: PlayerProfile): number {
  return profile.stats.rounds === 0 ? 0 : profile.stats.wins / profile.stats.rounds
}

// Broke players get a fresh stake but keep their stats, so a reset is a
// rebuy rather than an erase of history.
export function rebuy(profile: PlayerProfile): PlayerProfile {
  return { ...profile, chips: INITIAL_CHIPS }
}
