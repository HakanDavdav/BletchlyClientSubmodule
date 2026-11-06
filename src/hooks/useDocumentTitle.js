import { useEffect } from 'react'
import { formatPageTitle } from '../config/site'

export default function useDocumentTitle(title) {
  useEffect(() => {
    // Veri henüz gelmediyse mevcut sekme başlığını koru; boş başlıkla marka
    // adına düşmeyi engeller. Başlık verisi geldiğinde güncellenir.
    if (typeof title !== 'string' || title.trim() === '') return

    document.title = formatPageTitle(title)
  }, [title])
}
