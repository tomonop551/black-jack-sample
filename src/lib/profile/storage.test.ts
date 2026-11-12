import { afterAll, beforeEach, describe, expect, it } from 'bun:test'
import { applyResult, initialProfile } from './profile'
import { loadProfile, saveProfile } from './storage'

// Why not import the key from storage.ts? The key is part of the on-disk
// contract for existing players, so the test pins the literal to make an
// accidental rename fail loudly.
const STORAGE_KEY = 'blackjack:profile'

interface FakeStorage {
  entries: Map<string, string>
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

function installFakeStorage(): FakeStorage {
  const entries = new Map<string, string>()
  const fake: FakeStorage = {
    entries,
    getItem: (key) => (entries.has(key) ? (entries.get(key) as string) : null),
    setItem: (key, value) => {
      entries.set(key, value)
    },
  }
  Object.defineProperty(globalThis, 'localStorage', { value: fake, configurable: true, writable: true })
  return fake
}

// Why set the property to undefined instead of deleting it? `typeof` reports
// "undefined" for both a missing binding and an undefined-valued property, and
// keeping the property configurable makes restoration in afterAll uniform.
function removeLocalStorage(): void {
  Object.defineProperty(globalThis, 'localStorage', { value: undefined, configurable: true, writable: true })
}

const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')

let fake: FakeStorage

beforeEach(() => {
  fake = installFakeStorage()
})

// What: every other suite must see the same globals it would without this
// file, so the stub never outlives this module.
afterAll(() => {
  if (originalLocalStorage) {
    Object.defineProperty(globalThis, 'localStorage', originalLocalStorage)
  } else {
    Reflect.deleteProperty(globalThis, 'localStorage')
  }
})

describe('loadProfile', () => {
  // What: with nothing stored, a fresh player gets the initial profile.
  it('returns the initial profile when no record exists', async () => {
    expect(await loadProfile()).toEqual(initialProfile())
  })

  // What: a saved profile survives the save/load round trip unchanged.
  it('returns the stored profile after a save round trip', async () => {
    const played = applyResult(initialProfile(), 'playerWin', 100, true)

    await saveProfile(played)
    const loaded = await loadProfile()

    expect(loaded).toEqual(played)
    expect(JSON.parse(fake.entries.get(STORAGE_KEY) as string)).toEqual(played)
  })

  // What: a truncated record from an interrupted write falls back to a fresh
  // profile instead of bricking the game.
  it('returns the initial profile when the stored JSON is truncated', async () => {
    fake.entries.set(STORAGE_KEY, '{"chips": 500, "lastBet": 250, "sta')

    expect(await loadProfile()).toEqual(initialProfile())
  })

  // What: any unparsable payload is treated the same as a corrupt record.
  it('returns the initial profile when the stored value is not JSON', async () => {
    fake.entries.set(STORAGE_KEY, 'not-json')

    expect(await loadProfile()).toEqual(initialProfile())
  })

  // What: a record written by an older version migrates per-field, with
  // defaults filling only the missing top-level keys.
  it('merges a partial record with the initial profile', async () => {
    fake.entries.set(STORAGE_KEY, JSON.stringify({ chips: 500, lastBet: 250 }))

    expect(await loadProfile()).toEqual({ ...initialProfile(), chips: 500, lastBet: 250 })
  })

  // What: SSR renders have no localStorage global; the guard must resolve with
  // defaults rather than reject, because the client refetches on mount.
  it('resolves with the initial profile when localStorage is absent', async () => {
    removeLocalStorage()

    await expect(loadProfile()).resolves.toEqual(initialProfile())
  })
})

describe('saveProfile', () => {
  // What: the save writes the JSON record under the contract key and echoes
  // the profile back so the mutation can seed the query cache.
  it('persists the record and returns the same profile', async () => {
    const played = applyResult(initialProfile(), 'dealerWin', 50, false)

    const returned = await saveProfile(played)

    expect(returned).toEqual(played)
    expect(fake.entries.get(STORAGE_KEY)).toBe(JSON.stringify(played))
  })

  // What: the SSR guard turns a server-side save into a no-op instead of a
  // crash, so the mutation still completes.
  it('resolves with the profile untouched when localStorage is absent', async () => {
    removeLocalStorage()
    const played = initialProfile()

    await expect(saveProfile(played)).resolves.toEqual(played)
  })
})
