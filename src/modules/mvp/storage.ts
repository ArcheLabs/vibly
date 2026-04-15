import { createDefaultMvpState } from '@/modules/mvp/defaults'
import type { PersistedMvpState } from '@/modules/mvp/types'

const STORAGE_KEY = 'vibly:mvp-state'

export function loadPersistedMvpState(): PersistedMvpState | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PersistedMvpState>
    const defaults = createDefaultMvpState()

    return {
      ...defaults,
      ...parsed,
      chainState: {
        ...defaults.chainState,
        ...(parsed.chainState ?? {}),
        identitiesById: {
          ...defaults.chainState.identitiesById,
          ...(parsed.chainState?.identitiesById ?? {}),
        },
      },
      publicContentState: {
        ...defaults.publicContentState,
        ...(parsed.publicContentState ?? {}),
        contentsByRef: {
          ...defaults.publicContentState.contentsByRef,
          ...(parsed.publicContentState?.contentsByRef ?? {}),
        },
      },
      localPrivateState: {
        ...defaults.localPrivateState,
        ...(parsed.localPrivateState ?? {}),
        wallet: {
          ...defaults.localPrivateState.wallet,
          ...(parsed.localPrivateState?.wallet ?? {}),
        },
        profileDraft: {
          ...defaults.localPrivateState.profileDraft,
          ...(parsed.localPrivateState?.profileDraft ?? {}),
        },
        agentsLocal: parsed.localPrivateState?.agentsLocal ?? defaults.localPrivateState.agentsLocal,
        relations: parsed.localPrivateState?.relations ?? defaults.localPrivateState.relations,
        notifications:
          parsed.localPrivateState?.notifications ?? defaults.localPrivateState.notifications,
      },
      uiState: {
        ...defaults.uiState,
        ...(parsed.uiState ?? {}),
        dismissedBannerIds:
          parsed.uiState?.dismissedBannerIds ?? defaults.uiState.dismissedBannerIds,
      },
    }
  } catch {
    return null
  }
}

export function savePersistedMvpState(state: PersistedMvpState) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
