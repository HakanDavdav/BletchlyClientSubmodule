import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { searchApi } from '../api/searchApi'
import useDebouncedValue from './useDebouncedValue'

const take = (list, limit) => (limit ? list.slice(0, limit) : list)

async function fetchSuggestions(query, mode, filters, limits) {
  const filterParams = {
    query,
    orderType: filters?.orderType || 'None',
    startDate: filters?.startDate || null,
    endDate: filters?.endDate || null,
  }

  switch (mode) {
    case 'posts': {
      const res = await searchApi.filterPosts(filterParams)
      return { posts: take(res.data?.data || [], limits.single) }
    }
    case 'actors': {
      const res = await searchApi.filterActors(filterParams)
      return { actors: take(res.data?.data || [], limits.single) }
    }
    case 'tribes': {
      const res = await searchApi.filterTribes(filterParams)
      return { tribes: take(res.data?.data || [], limits.single) }
    }
    default: {
      const res = await searchApi.general(query)
      const data = res.data?.data
      return {
        posts: take(data?.posts || data?.Posts || [], limits.general),
        actors: take(data?.actors || data?.Actors || [], limits.general),
        tribes: take(data?.tribes || data?.Tribes || [], limits.general),
      }
    }
  }
}

/**
 * Debounced search-suggestion fetcher shared by the TopBar, the mobile search page and the
 * @mention editor. React Query keys every (mode, query, filters) combination, so a slow
 * response for an older query can never overwrite the result of a newer one.
 *
 * @param {string} query raw input text
 * @param {object} options
 * @param {'general'|'posts'|'actors'|'tribes'} [options.mode]
 * @param {{orderType?: string, startDate?: string, endDate?: string}} [options.filters]
 * @param {number} [options.delay] debounce in ms
 * @param {number} [options.limit] max items for single-mode results
 * @param {number} [options.generalLimit] max items per group in general mode
 * @param {boolean} [options.enabled]
 */
export default function useSearchSuggestions(
  query,
  { mode = 'general', filters = null, delay = 500, limit, generalLimit, enabled = true } = {}
) {
  const trimmed = (query || '').trim()
  const debounced = useDebouncedValue(trimmed, delay)
  const active = enabled && debounced.length > 0

  const { data, isFetching } = useQuery({
    queryKey: [
      'searchSuggestions',
      mode,
      debounced,
      filters?.orderType || '',
      filters?.startDate || '',
      filters?.endDate || '',
      limit ?? null,
      generalLimit ?? null,
    ],
    queryFn: () => fetchSuggestions(debounced, mode, filters, { single: limit, general: generalLimit }),
    enabled: active,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })

  const hasQuery = enabled && trimmed.length > 0
  return {
    suggestions: hasQuery && active ? (data ?? null) : null,
    isLoading: hasQuery && (trimmed !== debounced || isFetching),
  }
}
