import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actorApi } from '../api/actorApi'
import useAuthStore from '../store/authStore'

export default function useFavourite(contentItemId) {
  const { isLoggedIn, actorId } = useAuthStore()
  const queryClient = useQueryClient()
  const queryKey = ['favourites', actorId]

  const { data: favouriteIds = [] } = useQuery({
    queryKey,
    queryFn: () => actorApi.getFavouriteContentItemIds().then((r) => r.data?.data || []),
    enabled: isLoggedIn && !!actorId,
    staleTime: 60_000,
  })

  const isFavourite = favouriteIds.includes(contentItemId)

  const mutation = useMutation({
    mutationFn: (next) =>
      next ? actorApi.addFavourite(contentItemId) : actorApi.removeFavourite(contentItemId),
    meta: { showErrorToast: true },
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (old = []) => {
        const ids = new Set(old)
        if (next) ids.add(contentItemId)
        else ids.delete(contentItemId)
        return [...ids]
      })
      return { previous }
    },
    onError: (_error, _next, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ['profile-favourites'] })
      if (actorId) queryClient.invalidateQueries({ queryKey: ['actorProfile', actorId] })
    },
  })

  return {
    isFavourite,
    isPending: mutation.isPending,
    isLoggedIn,
    toggleFavourite: () => {
      if (!isLoggedIn || mutation.isPending) return
      mutation.mutate(!isFavourite)
    },
  }
}
