// Public API for Blackjack game logic.
//
// Why not import each module directly? A barrel file keeps callers decoupled
// from the internal file layout, so the directory structure can evolve without
// touching every import site.
export * from './types'
export * from './deck'
export * from './scoring'
export * from './game'
