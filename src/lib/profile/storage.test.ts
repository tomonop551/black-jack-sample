import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { INITIAL_CHIPS, MIN_BET, PROFILE_VERSION, initialProfile } from './profile'
import { loadProfile, normalizeProfile } from './storage'

// What: normalizeProfile keeps every valid stored field and replaces missing
// or malformed ones with defaults, without trusting the stored types.
describe('normalizeProfile', () => {
  it('defaults a stats field that the stored record predates', () => {
    const profile = normalizeProfile({
      version: PROFILE_VERSION,
      chips: 500,
      lastBet: 20,
      stats: { rounds: 3, wins: 2 },
    })

    expect(profile.stats).toEqual({ rounds: 3, wins: 2, losses: 0, pushes: 0, blackjacks: 0 })
    expect(profile.chips).toBe(500)
    expect(profile.lastBet).toBe(20)
  })

  it('keeps the real chips and stats of a pre-versioning record and stamps the version', () => {
    const profile = normalizeProfile({
      chips: 1234,
      lastBet: 50,
      stats: { rounds: 10, wins: 6, losses: 3, pushes: 1, blackjacks: 2 },
    })

    expect(profile).toEqual({
      version: PROFILE_VERSION,
      chips: 1234,
      lastBet: 50,
      stats: { rounds: 10, wins: 6, losses: 3, pushes: 1, blackjacks: 2 },
    })
  })

  it('falls back to the default bankroll for a non-numeric chips value', () => {
    expect(normalizeProfile({ chips: 'abc' }).chips).toBe(INITIAL_CHIPS)
  })

  it('rejects NaN, fractional, and negative numbers', () => {
    expect(normalizeProfile({ chips: NaN }).chips).toBe(INITIAL_CHIPS)
    expect(normalizeProfile({ chips: 100.5 }).chips).toBe(INITIAL_CHIPS)
    expect(normalizeProfile({ chips: -50 }).chips).toBe(INITIAL_CHIPS)
    expect(normalizeProfile({ lastBet: Infinity }).lastBet).toBe(MIN_BET)
  })

  it('replaces a null stats object with the default stats', () => {
    expect(normalizeProfile({ chips: 300, stats: null }).stats).toEqual(initialProfile().stats)
  })

  it('defaults only the malformed stats field and keeps its valid siblings', () => {
    const profile = normalizeProfile({
      stats: { rounds: 4, wins: 'many', losses: 1, pushes: 0, blackjacks: 1 },
    })

    expect(profile.stats).toEqual({ rounds: 4, wins: 0, losses: 1, pushes: 0, blackjacks: 1 })
  })

  it('drops unknown extra keys instead of carrying them into the live profile', () => {
    const profile = normalizeProfile({ chips: 100, hacker: true, stats: { pwned: 1 } })

    expect(Object.keys(profile).sort()).toEqual(['chips', 'lastBet', 'stats', 'version'])
    expect(Object.keys(profile.stats)).toHaveLength(5)
  })

  it('returns a fresh profile when the record is not an object at all', () => {
    expect(normalizeProfile('nonsense')).toEqual(initialProfile())
    expect(normalizeProfile([1, 2, 3])).toEqual(initialProfile())
    expect(normalizeProfile(null)).toEqual(initialProfile())
  })
})

// What: loadProfile hands the game a normalized profile and pays the
// migration once by persisting the upgrade.
describe('loadProfile', () => {
  const STORAGE_KEY = 'blackjack:profile'
  let store: Map<string, string>
  let previous: PropertyDescriptor | undefined

  beforeEach(() => {
    store = new Map()
    previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      writable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => void store.set(key, value),
      },
    })
  })

  afterEach(() => {
    if (previous) {
      Object.defineProperty(globalThis, 'localStorage', previous)
    } else {
      Reflect.deleteProperty(globalThis, 'localStorage')
    }
  })

  it('rewrites a legacy record with its normalized form on load', async () => {
    store.set(STORAGE_KEY, '{"chips":1234,"lastBet":50,"stats":{"rounds":10,"wins":6}}')

    const profile = await loadProfile()

    expect(profile.chips).toBe(1234)
    expect(profile.stats).toEqual({ rounds: 10, wins: 6, losses: 0, pushes: 0, blackjacks: 0 })
    expect(JSON.parse(store.get(STORAGE_KEY)!)).toEqual(profile)
  })

  it('leaves an already-normalized record byte-identical', async () => {
    const stored = JSON.stringify(initialProfile())
    store.set(STORAGE_KEY, stored)

    await loadProfile()

    expect(store.get(STORAGE_KEY)).toBe(stored)
  })

  it('falls back to a fresh profile on a corrupt record without overwriting it', async () => {
    store.set(STORAGE_KEY, '{not json')

    expect(await loadProfile()).toEqual(initialProfile())
    expect(store.get(STORAGE_KEY)).toBe('{not json')
  })

  it('returns a fresh profile when nothing is stored', async () => {
    expect(await loadProfile()).toEqual(initialProfile())
  })
})
