import { INITIAL_CHIPS, MIN_BET, PROFILE_VERSION, initialProfile } from './profile'
import type { GameStats, PlayerProfile } from './types'

const STORAGE_KEY = 'blackjack:profile'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Why not `typeof value === 'number'` alone? NaN and Infinity pass that test
// and poison chip arithmetic just like a string would, and a fractional or
// negative counter has no meaning in this game.
function normalizeCount(value: unknown, fallback: number, min = 0): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min ? value : fallback
}

// Why not spread the stored stats over the defaults? A hand-edited record
// could smuggle unknown keys into the live profile that way, and a wrong
// type would survive the merge. Listing each counter keeps the schema pinned
// and lets one bad field default independently of the good ones.
function normalizeStats(value: unknown): GameStats {
  const fresh = initialProfile().stats
  const stored: Record<string, unknown> = isRecord(value) ? value : {}
  return {
    rounds: normalizeCount(stored.rounds, fresh.rounds),
    wins: normalizeCount(stored.wins, fresh.wins),
    losses: normalizeCount(stored.losses, fresh.losses),
    pushes: normalizeCount(stored.pushes, fresh.pushes),
    blackjacks: normalizeCount(stored.blackjacks, fresh.blackjacks),
  }
}

// Upgrade an arbitrary stored record — or whatever JSON.parse produced — to
// the current PlayerProfile shape, keeping every field that validates.
// A missing or non-numeric version means the record predates versioning
// (version 0); v0 and v1 share the same fields, so filling missing and
// invalid keys per field is the entire v0-to-v1 migration. Breaking shape
// changes branch on the read version here before normalizing.
export function normalizeProfile(raw: unknown): PlayerProfile {
  const stored: Record<string, unknown> = isRecord(raw) ? raw : {}
  return {
    version: PROFILE_VERSION,
    chips: normalizeCount(stored.chips, INITIAL_CHIPS),
    lastBet: normalizeCount(stored.lastBet, MIN_BET, MIN_BET),
    stats: normalizeStats(stored.stats),
  }
}

// Why async wrappers around synchronous localStorage? React Query expects
// Promise-returning functions, and the seam lets us swap in a real backend
// later without touching callers.
export async function loadProfile(): Promise<PlayerProfile> {
  // SSR has no localStorage; the client refetches on mount and corrects it.
  if (typeof localStorage === 'undefined') {
    return initialProfile()
  }

  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return initialProfile()
  }

  try {
    const profile = normalizeProfile(JSON.parse(raw))
    // Why not persist unconditionally on every load? An already-normalized
    // record would pay a storage write each reload; rewriting only on drift
    // makes the migration a one-time cost.
    if (JSON.stringify(profile) !== raw) {
      return saveProfile(profile)
    }
    return profile
  } catch {
    // A corrupt record must not break the game; fall back to a fresh profile.
    return initialProfile()
  }
}

export async function saveProfile(profile: PlayerProfile): Promise<PlayerProfile> {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  }
  return profile
}
