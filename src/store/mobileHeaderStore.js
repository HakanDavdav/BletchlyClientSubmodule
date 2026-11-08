import { create } from 'zustand'

export const useMobileHeaderStore = create((set) => ({
  customHeader: null,
  setCustomHeader: (customHeader) => set({ customHeader }),
  clearCustomHeader: () => set({ customHeader: null }),
}))

