import { useTranslation } from 'react-i18next'

export default function InfiniteScrollStatus({
  isFetching = false,
  hasNextPage = false,
  hasItems = true,
  className = '',
}) {
  const { t } = useTranslation()

  if (isFetching) {
    return (
      <div className={`infinite-scroll-status infinite-scroll-status--loading ${className}`.trim()}>
        <div className="spinner spinner-md" />
      </div>
    )
  }

  if (!hasNextPage && hasItems) {
    return (
      <p className={`infinite-scroll-status ${className}`.trim()}>
        {t('common.no_more_results')}
      </p>
    )
  }

  return null
}
