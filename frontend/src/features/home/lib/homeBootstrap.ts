import type { PersistedHomeFilters } from '@/features/home/lib/browserState'

export type HomeChannel = 'shared' | 'direct'

export interface HomeBootstrapState {
  channel: HomeChannel
  sport: string
  locationInput: string
}

interface ResolveHomeBootstrapStateParams {
  hasUrlState: boolean
  defaultSport: string
  urlSport: string | null
  urlLocation: string | null
  persistedFilters: PersistedHomeFilters | null
}

export function resolveInitialLocationLabel(label: string | null | undefined): string {
  return label?.trim() ?? ''
}

export function resolveHomeBootstrapState({
  hasUrlState,
  defaultSport,
  urlSport,
  urlLocation,
  persistedFilters,
}: ResolveHomeBootstrapStateParams): HomeBootstrapState {
  const channel: HomeChannel = hasUrlState ? 'shared' : 'direct'

  let sport = defaultSport
  let locationInput = ''

  if (channel === 'shared') {
    if (urlSport) {
      sport = urlSport
    }

    locationInput = resolveInitialLocationLabel(urlLocation)
  } else if (persistedFilters) {
    sport = persistedFilters.sport
    locationInput = resolveInitialLocationLabel(persistedFilters.loc)
  }

  return {
    channel,
    sport,
    locationInput,
  }
}
