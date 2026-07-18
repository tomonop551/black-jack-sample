import { describe, expect, it } from 'bun:test'
import { INITIAL_CHIPS, applyResult, chipDelta, initialProfile, rebuy, winRate } from './profile'

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

// What: applyResult updates chips, stats, and lastBet from a finished round.
describe('applyResult', () => {
  it('credits winnings and counts the round as a win', () => {
    const next = applyResult(initialProfile(), 'playerWin', 100, false)

    expect(next.chips).toBe(INITIAL_CHIPS + 100)
    expect(next.lastBet).toBe(100)
    expect(next.stats).toEqual({ rounds: 1, wins: 1, losses: 0, pushes: 0, blackjacks: 0 })
  })

  it('counts a blackjack win separately', () => {
    const next = applyResult(initialProfile(), 'playerWin', 100, true)

    expect(next.chips).toBe(INITIAL_CHIPS + 150)
    expect(next.stats.blackjacks).toBe(1)
    expect(next.stats.wins).toBe(1)
  })

  it('deducts the bet and counts a loss', () => {
    const next = applyResult(initialProfile(), 'dealerWin', 50, false)

    expect(next.chips).toBe(INITIAL_CHIPS - 50)
    expect(next.stats.losses).toBe(1)
  })

  it('keeps chips unchanged and counts a push', () => {
    const next = applyResult(initialProfile(), 'push', 50, false)

    expect(next.chips).toBe(INITIAL_CHIPS)
    expect(next.stats.pushes).toBe(1)
  })

  it('accumulates stats across rounds without mutating the input', () => {
    const first = applyResult(initialProfile(), 'playerWin', 10, false)
    const second = applyResult(first, 'dealerWin', 20, false)

    expect(second.stats).toEqual({ rounds: 2, wins: 1, losses: 1, pushes: 0, blackjacks: 0 })
    expect(first.stats.rounds).toBe(1)
  })
})

// What: winRate is the share of rounds won, and zero before any round.
describe('winRate', () => {
  it('returns zero when no rounds have been played', () => {
    expect(winRate(initialProfile())).toBe(0)
  })

  it('computes wins over total rounds', () => {
    const profile = applyResult(applyResult(initialProfile(), 'playerWin', 10, false), 'push', 10, false)
    expect(winRate(profile)).toBe(0.5)
  })
})

// What: rebuy restores the initial stake while preserving stats.
describe('rebuy', () => {
  it('refills chips but keeps history', () => {
    const played = applyResult(initialProfile(), 'dealerWin', INITIAL_CHIPS, false)
    const next = rebuy(played)

    expect(next.chips).toBe(INITIAL_CHIPS)
    expect(next.stats.rounds).toBe(1)
  })
})
