import { describe, expect, it } from 'bun:test'
import type { GameResult } from '../blackjack'
import { INITIAL_CHIPS, applyResult, chipDelta, initialProfile, rebuy, resolvedStake, winRate } from './profile'
import type { RecordResultInput } from './types'

// What: a round record with only the flags a test cares about spelled out.
function round(
  result: Exclude<GameResult, null>,
  bet: number,
  flags: Partial<RecordResultInput> = {},
): RecordResultInput {
  return { result, bet, playerBlackjack: false, doubled: false, ...flags }
}

// What: chipDelta converts a round outcome into the correct chip change.
describe('chipDelta', () => {
  it('pays even money on a regular win', () => {
    expect(chipDelta('playerWin', 100, false)).toBe(100)
  })

  it('pays 3:2 on a blackjack win', () => {
    expect(chipDelta('playerWin', 100, true)).toBe(150)
  })

  it('floors odd blackjack payouts to keep chips integral', () => {
    expect(chipDelta('playerWin', 25, true)).toBe(37)
  })

  it('deducts the bet on a loss', () => {
    expect(chipDelta('dealerWin', 100, false)).toBe(-100)
  })

  it('returns zero on a push', () => {
    expect(chipDelta('push', 100, false)).toBe(0)
  })
})

// What: resolvedStake is the wager a round is settled at.
describe('resolvedStake', () => {
  it('doubles the bet for a doubled round', () => {
    expect(resolvedStake(100, true)).toBe(200)
  })

  it('keeps the bet unchanged otherwise', () => {
    expect(resolvedStake(100, false)).toBe(100)
  })
})

// What: applyResult updates chips, stats, and lastBet from a finished round.
describe('applyResult', () => {
  it('credits winnings and counts the round as a win', () => {
    const next = applyResult(initialProfile(), round('playerWin', 100))

    expect(next.chips).toBe(INITIAL_CHIPS + 100)
    expect(next.lastBet).toBe(100)
    expect(next.stats).toEqual({ rounds: 1, wins: 1, losses: 0, pushes: 0, blackjacks: 0 })
  })

  it('counts a blackjack win separately', () => {
    const next = applyResult(initialProfile(), round('playerWin', 100, { playerBlackjack: true }))

    expect(next.chips).toBe(INITIAL_CHIPS + 150)
    expect(next.stats.blackjacks).toBe(1)
    expect(next.stats.wins).toBe(1)
  })

  it('deducts the bet and counts a loss', () => {
    const next = applyResult(initialProfile(), round('dealerWin', 50))

    expect(next.chips).toBe(INITIAL_CHIPS - 50)
    expect(next.stats.losses).toBe(1)
  })

  it('keeps chips unchanged and counts a push', () => {
    const next = applyResult(initialProfile(), round('push', 50))

    expect(next.chips).toBe(INITIAL_CHIPS)
    expect(next.stats.pushes).toBe(1)
  })

  it('accumulates stats across rounds without mutating the input', () => {
    const first = applyResult(initialProfile(), round('playerWin', 10))
    const second = applyResult(first, round('dealerWin', 20))

    expect(second.stats).toEqual({ rounds: 2, wins: 1, losses: 1, pushes: 0, blackjacks: 0 })
    expect(first.stats.rounds).toBe(1)
  })

  it('credits twice the bet for a doubled win', () => {
    const next = applyResult(initialProfile(), round('playerWin', 100, { doubled: true }))

    expect(next.chips).toBe(INITIAL_CHIPS + 200)
    expect(next.stats).toEqual({ rounds: 1, wins: 1, losses: 0, pushes: 0, blackjacks: 0 })
  })

  it('deducts twice the bet for a doubled loss', () => {
    const next = applyResult(initialProfile(), round('dealerWin', 100, { doubled: true }))

    expect(next.chips).toBe(INITIAL_CHIPS - 200)
    expect(next.stats.losses).toBe(1)
  })

  it('keeps chips unchanged for a doubled push', () => {
    const next = applyResult(initialProfile(), round('push', 50, { doubled: true }))

    expect(next.chips).toBe(INITIAL_CHIPS)
    expect(next.stats.pushes).toBe(1)
  })

  it('keeps lastBet at the base bet so the next round reuses it', () => {
    const next = applyResult(initialProfile(), round('dealerWin', 50, { doubled: true }))

    expect(next.lastBet).toBe(50)
  })
})

// What: winRate is the share of rounds won, and zero before any round.
describe('winRate', () => {
  it('returns zero when no rounds have been played', () => {
    expect(winRate(initialProfile())).toBe(0)
  })

  it('computes wins over total rounds', () => {
    const profile = applyResult(
      applyResult(initialProfile(), round('playerWin', 10)),
      round('push', 10),
    )
    expect(winRate(profile)).toBe(0.5)
  })
})

// What: rebuy restores the initial stake while preserving stats.
describe('rebuy', () => {
  it('refills chips but keeps history', () => {
    const played = applyResult(initialProfile(), round('dealerWin', INITIAL_CHIPS))
    const next = rebuy(played)

    expect(next.chips).toBe(INITIAL_CHIPS)
    expect(next.stats.rounds).toBe(1)
  })
})
