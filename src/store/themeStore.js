import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { normalizeHex, FREE_THEME_COLORS } from '../utils/themeColor'

/**
 * Tema rengi modeli (Yetki doğrulamalı / Dark Mode stili tarayıcı odaklı):
 *  - isGreenMode / customColor → tarayıcıda saklanan ve o an uygulanan tema rengi.
 *  - Varsayılan renk: YEŞİL (isGreenMode: true, customColor: null).
 *  - Ücretsiz renkler: Yeşil (#10b981), Mavi (#3b82f6), Pembe (#ec4899).
 *    Login/logout'tan bağımsız olarak tarayıcıda seçildiği gibi korunur.
 *  - Premium renkler (Mor, Turuncu vb.): Sadece kullanıcı Premium ise geçerlidir.
 *    Kullanıcı premium değilse veya misafirse varsayılan yeşile güvenle çekilir.
 */
const useThemeStore = create(
  persist(
    (set, get) => ({
      isDarkMode: false,
      isGreenMode: true,
      customColor: null,
      savedCustomColor: null,

      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      toggleGreenMode: () => set((state) => ({ isGreenMode: !state.isGreenMode })),
      setTheme: (isDark) => set({ isDarkMode: isDark }),
      setGreenMode: (isGreen) => set({ isGreenMode: isGreen }),
      setCustomColor: (color) => set({ customColor: color }),
      setSavedCustomColor: (color) => set({ savedCustomColor: color }),

      /**
       * Kullanıcının paletten renk seçimi:
       * '#10b981' → yeşil (isGreenMode: true, customColor: null)
       * '#3b82f6' → mavi (isGreenMode: false, customColor: null)
       * diğer → custom (isGreenMode: false, customColor: normalized)
       */
      selectThemeColor: (color) =>
        set(() => {
          const normalized = normalizeHex(color) || (typeof color === 'string' ? color.toLowerCase() : '')
          if (normalized === '#10b981') {
            return {
              isGreenMode: true,
              customColor: null,
            }
          }
          if (normalized === '#3b82f6') {
            return {
              isGreenMode: false,
              customColor: null,
            }
          }
          return {
            isGreenMode: false,
            customColor: normalized,
          }
        }),

      /**
       * Premium yetki kontrolü:
       * Kullanıcı premium değilse veya misafirse, aktif renk ücretsiz (free) renklerden
       * biri değilse (yani Mor, Turkuaz, özel hex vb. ise) varsayılan yeşile geri döner.
       */
      validateThemePermission: (isPremium) => {
        if (isPremium) return
        const state = get()
        if (state.customColor && !FREE_THEME_COLORS.includes(state.customColor.toLowerCase())) {
          set({
            isGreenMode: true,
            customColor: null,
          })
        }
      },

      /** Varsayılan yeşile sıfırla */
      resetToDefault: () => set({ isGreenMode: true, customColor: null }),
      /** Geriye dönük uyumluluk */
      resetToDefaultBlue: () => set({ isGreenMode: false, customColor: null }),
      restorePreferredColor: () => {},
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persisted, version) => {
        if (!persisted) return persisted
        if (version < 2) {
          // Eski versiyonda hiçbir renk seçilmemişse yeni varsayılan yeşil yapılır.
          if (!persisted.customColor && !persisted.isGreenMode && !persisted.preferredCustomColor && !persisted.preferredGreenMode) {
            return {
              ...persisted,
              isGreenMode: true,
              customColor: null,
            }
          }
          // Eski preferredCustomColor varsa customColor'a aktar
          if (persisted.preferredCustomColor && !persisted.customColor) {
            return {
              ...persisted,
              customColor: persisted.preferredCustomColor,
              isGreenMode: false,
            }
          }
        }
        return persisted
      },
    }
  )
)

export default useThemeStore
