export interface GameStats {
  rounds: number
  wins: number
  losses: number
  pushes: number
  blackjacks: number
}

// The profile bundles every value that survives a reload so storage stays a
// single atomic record instead of several keys that can drift apart.
// `version` is the storage schema version; records written before versioning
// exist carry no key and are read as version 0.
export interface PlayerProfile {
  version: number
  chips: number
  lastBet: number
  stats: GameStats
}

export interface RecordResultInput {
  result: Exclude<import('../blackjack').GameResult, null>
  bet: number
  playerBlackjack: boolean
}
