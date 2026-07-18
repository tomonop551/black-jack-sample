export interface GameStats {
  rounds: number
  wins: number
  losses: number
  pushes: number
  blackjacks: number
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
}
