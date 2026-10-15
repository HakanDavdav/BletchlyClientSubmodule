import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/**
 * UI Store — merkezi panel/layout durumu.
 *
 * centerView: CenterPanel'de ne gösterildiği
 *   - 'feed'          → Ana akış (trending/recent posts)
 *   - 'post'          → Post detay + entry listesi
 *   - 'entry'         → ContentItem bağlamsal görünüm (EntryDto veya PostDto discriminate)
 *   - 'profile'       → ActorProfileView
 *   - 'tribe'         → TribeProfileView
 *   - 'search'        → Arama sonuçları
 *   - 'leaderboard'   → Sıralama tablosu
 *   - 'create-post'   → Yeni başlık oluşturma formu
 *   - 'create-tribe'  → Yeni tribe oluşturma formu
 *   - 'create-bot'    → Yeni bot oluşturma formu
 *   - 'init-profile'  → Yeni kayıt sonrası profil tamamlama formu
 *   - 'account-settings' → Hesap ayarları
 *   - 'hierarchy'     → ActorHierarchyTree overlay
 */
const useUIStore = create(
  persist(
    (set) => ({
      // ─── Left Panel ───────────────────────────────────────────────────────────
      activeLeftCacheType: 'recent',
      setActiveLeftCacheType: (type) => set({ activeLeftCacheType: type }),

      isActivitiesExpanded: false,
      toggleActivities: () => set((state) => ({ isActivitiesExpanded: !state.isActivitiesExpanded })),

      isDebatesExpanded: false,
      toggleDebates: () => set((state) => ({ isDebatesExpanded: !state.isDebatesExpanded })),

      // ─── Limitler & Miras Paneli (Profil + Tribe sayfaları ORTAK state) ───────
      // Biri açılırsa diğeri de açık kalır; navigasyonlar arasında hatırlanır.
      isLimitsExpanded: false,
      toggleLimits: () => set((state) => ({ isLimitsExpanded: !state.isLimitsExpanded })),

      // ─── Responsive Drawers ───────────────────────────────────────────────────
      isLeftDrawerOpen: false,
      isRightDrawerOpen: false,
      openLeftDrawer: () => set({ isLeftDrawerOpen: true }),
      toggleLeftDrawer: () => set((state) => ({ isLeftDrawerOpen: !state.isLeftDrawerOpen })),
      toggleRightDrawer: () => set((state) => ({ isRightDrawerOpen: !state.isRightDrawerOpen })),
      closeDrawers: () => set({ isLeftDrawerOpen: false, isRightDrawerOpen: false }),

      // ─── My Tribes Dropdown ───────────────────────────────────────────────────
      isMyTribesOpen: false,
      toggleMyTribes: () => set((state) => ({ isMyTribesOpen: !state.isMyTribesOpen })),
      closeMyTribes: () => set({ isMyTribesOpen: false }),

      // ─── Search ───────────────────────────────────────────────────────────────
      searchMode: 'general', // 'general' | 'posts' | 'actors' | 'tribes'
      setSearchMode: (mode) => set({ searchMode: mode }),

      // ─── Ambient Bots / Welcome / Mind (profil arka planı seçenekleri) ────────
      isBotsAmbience: false,
      toggleBotsAmbience: () =>
        set((state) => ({
          isBotsAmbience: !state.isBotsAmbience,
          isWelcomeAmbience: false,
          isMindAmbience: false,
        })),
      isWelcomeAmbience: false,
      toggleWelcomeAmbience: () =>
        set((state) => ({
          isWelcomeAmbience: !state.isWelcomeAmbience,
          isBotsAmbience: false,
          isMindAmbience: false,
        })),
      isMindAmbience: false,
      toggleMindAmbience: () =>
        set((state) => ({
          isMindAmbience: !state.isMindAmbience,
          isBotsAmbience: false,
          isWelcomeAmbience: false,
        })),
    }),
    {
      name: 'ui-store-storage', // sessionStorage key
      storage: createJSONStorage(() => sessionStorage), // F5 atıldığında veriyi hatırlar, sekme kapandığında silinir
    }
  )
)

export default useUIStore
