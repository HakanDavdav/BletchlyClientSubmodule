import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Auth Store — kullanıcının oturum bilgilerini tutar.
 *
 * actorId: Login response'unda backend'den gelen Guid.
 * Logout olana kadar localStorage'da persist edilir.
 * Sayfa yenilenince kaybolmaz.
 *
 * Kullanımı:
 *   const { actorId, isLoggedIn, setAuth, logout } = useAuthStore()
 */
const useAuthStore = create(
  persist(
    (set) => ({
      actorId: null,       // string (Guid) | null
      isProfileCreated: false,
      isExternalAuth: false, // Dış sağlayıcı (Google, Microsoft vb.) ile mi giriş yapıldı?
      isAdmin: false,      // Kullanıcı Admin mi?
      isDeveloper: false,  // Kullanıcı Developer mı?

      /**
       * Login başarılı olunca çağrılır.
       * @param {string} actorId - backend'den gelen Guid string
       * @param {boolean} isProfileCreated - profil oluşturulmuş mu?
       * @param {boolean} isExternalAuth - dış sağlayıcı ile mi login olundu?
       * @param {boolean} isAdmin - kullanıcı admin rolüne sahip mi?
       * @param {boolean} isDeveloper - kullanıcı developer rolüne sahip mi?
       */
      setAuth: (actorId, isProfileCreated, isExternalAuth = false, isAdmin = false, isDeveloper = false) => set({
        actorId,
        isProfileCreated,
        isExternalAuth,
        isAdmin,
        isDeveloper,
        isLoggedIn: true,
      }),

      setProfileCreated: (status) => set({
        isProfileCreated: status
      }),

      /**
       * Logout olunca çağrılır.
       * actorId ve isLoggedIn sıfırlanır.
       */
      logout: () => set({
        actorId: null,
        isProfileCreated: false,
        isExternalAuth: false,
        isAdmin: false,
        isDeveloper: false,
        isLoggedIn: false,
      }),
    }),
    {
      name: 'bletchly-auth',          // localStorage key
      partialize: (state) => ({      // sadece bu alanlar persist edilir
        actorId: state.actorId,
        isProfileCreated: state.isProfileCreated,
        isExternalAuth: state.isExternalAuth,
        isAdmin: state.isAdmin,
        isDeveloper: state.isDeveloper,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
)

export default useAuthStore
