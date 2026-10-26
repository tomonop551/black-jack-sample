export interface GameStats {
  rounds: number
  wins: number
  losses: number
  pushes: number
  blackjacks: number
  // Why separate counters instead of wins/losses? Insurance is a side bet, not
  // a round, so folding it in would distort the round-based win rate.
  insuranceWon: number
  insuranceLost: number
}

export interface InsuranceSettlement {
  stake: number
  won: boolean
}

// The profile bundles every value that survives a reload so storage stays a
// single atomic record instead of several keys that can drift apart.
export interface PlayerProfile {
  chips: number
  lastBet: number
  stats: GameStats
}

export interface RecordResultInput {
  result: Exclude<import('../blackjack').GameResult, null>
  bet: number
  playerBlackjack: boolean
  insurance: InsuranceSettlement | null
}
