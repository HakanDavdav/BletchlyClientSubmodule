import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/**
 * Tema rengi modeli:
 *  - isGreenMode / customColor  → o an UYGULANAN renk (mavi = ikisi de boş)
 *  - preferredGreenMode / preferredCustomColor → tarayıcıda saklanan TERCİH
 *
 * Kullanıcı bir renk seçtiğinde ikisi birlikte güncellenir. Logout'ta yalnızca
 * uygulanan renk maviye döner (tercih korunur); login'de tercih geri yüklenir.
 */
const useThemeStore = create(
  persist(
    (set) => ({
      isDarkMode: false,
      isGreenMode: false,
      customColor: null,
      savedCustomColor: null,
      preferredGreenMode: false,
      preferredCustomColor: null,
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      toggleGreenMode: () => set((state) => ({ isGreenMode: !state.isGreenMode })),
      setTheme: (isDark) => set({ isDarkMode: isDark }),
      setGreenMode: (isGreen) => set({ isGreenMode: isGreen }),
      setCustomColor: (color) => set({ customColor: color }),
      setSavedCustomColor: (color) => set({ savedCustomColor: color }),

      /**
       * Kullanıcının paletten renk seçimi: uygulanan renk + tercih birlikte.
       * '#10b981' → yeşil, '#3b82f6' (veya boş) → mavi, diğer → custom.
       */
      selectThemeColor: (color) =>
        set(() => {
          const normalized = typeof color === 'string' ? color.toLowerCase() : ''
          if (normalized === '#10b981') {
            return {
              isGreenMode: true,
              customColor: null,
              preferredGreenMode: true,
              preferredCustomColor: null,
            }
          }
          if (!normalized || normalized === '#3b82f6') {
            return {
              isGreenMode: false,
              customColor: null,
              preferredGreenMode: false,
              preferredCustomColor: null,
            }
          }
          return {
            isGreenMode: false,
            customColor: normalized,
            preferredGreenMode: false,
            preferredCustomColor: normalized,
          }
        }),

      /** Logout: site varsayılan maviye döner; tercih korunur. */
      resetToDefaultBlue: () => set({ isGreenMode: false, customColor: null }),

      /** Login / sayfa açılışı: tarayıcıdaki tercih edilen renk geri gelir. */
      restorePreferredColor: () =>
        set((state) => ({
          isGreenMode: state.preferredGreenMode,
          customColor: state.preferredCustomColor,
        })),
    }),
    {
      name: 'theme-storage', // localStorage key
      storage: createJSONStorage(() => localStorage), // Persist across sessions
      version: 1,
      // v0 (eski kayıtlar): tercih alanları yoktu → mevcut rengi tercih say.
      migrate: (persisted, version) => {
        if (!persisted) return persisted
        if (version < 1) {
          return {
            ...persisted,
            preferredGreenMode: Boolean(persisted.isGreenMode),
            preferredCustomColor: persisted.customColor ?? null,
          }
        }
        return persisted
      },
    }
  )
)

export default useThemeStore
