import { initialProfile } from './profile'
import type { PlayerProfile } from './types'

const STORAGE_KEY = 'blackjack:profile'

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
    return { ...initialProfile(), ...(JSON.parse(raw) as PlayerProfile) }
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
