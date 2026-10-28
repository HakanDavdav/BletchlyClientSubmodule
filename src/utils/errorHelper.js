/**
 * Standart sayfa sorgusu (useQuery) hata mesajı belirleyici.
 * - 404 (Not Found) durumunda: "Content not found." (i18n: common.content_not_found)
 * - Diğer tüm hata durumlarında: "An error occurred." (i18n: common.error)
 */
export function getQueryErrorMessage(error, t, defaultIs404 = false) {
  if (!error) {
    return defaultIs404
      ? t('common.content_not_found', 'Content not found.')
      : t('common.error', 'An error occurred.')
  }

  const is404 =
    error.response?.status === 404 ||
    error.status === 404 ||
    error.errors?.some((e) => (e.code || e.Code) === 'NotFound')

  return is404
    ? t('common.content_not_found', 'Content not found.')
    : t('common.error', 'An error occurred.')
}
