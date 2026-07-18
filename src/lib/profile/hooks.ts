import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { applyResult, initialProfile, rebuy } from './profile'
import { loadProfile, saveProfile } from './storage'
import type { PlayerProfile, RecordResultInput } from './types'

const PROFILE_KEY = ['profile'] as const

export function useProfile() {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: loadProfile,
  })
}

// Read the current profile from the cache inside the mutation so rapid
// consecutive rounds always build on the latest saved state.
export function useRecordResult() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RecordResultInput) => {
      const current = queryClient.getQueryData<PlayerProfile>(PROFILE_KEY) ?? initialProfile()
      return saveProfile(applyResult(current, input.result, input.bet, input.playerBlackjack))
    },
    // Why setQueryData over invalidation? The mutation already returns the
    // fresh profile, so re-reading localStorage would be a wasted round trip.
    onSuccess: (profile) => queryClient.setQueryData(PROFILE_KEY, profile),
  })
}

export function useRebuy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => {
      const current = queryClient.getQueryData<PlayerProfile>(PROFILE_KEY) ?? initialProfile()
      return saveProfile(rebuy(current))
    },
    onSuccess: (profile) => queryClient.setQueryData(PROFILE_KEY, profile),
  })
}
