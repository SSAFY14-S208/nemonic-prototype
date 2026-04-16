import { create } from 'zustand'

export type OnboardingStep =
  | 'idle'
  | 'welcome'
  | 'drawing'
  | 'camera-aim'
  | 'print-ready'
  | 'printing'
  | 'paper-modal'
  | 'entering'

interface LandingStore {
  isExploreMode: boolean
  setExploreMode: (v: boolean) => void
  onboardingStep: OnboardingStep
  setOnboardingStep: (s: OnboardingStep) => void
  drawnImageUrl: string | null
  setDrawnImageUrl: (url: string | null) => void
}

export const useLandingStore = create<LandingStore>((set) => ({
  isExploreMode: false,
  setExploreMode: (v) => set({ isExploreMode: v }),
  onboardingStep: 'idle',
  setOnboardingStep: (s) => set({ onboardingStep: s }),
  drawnImageUrl: null,
  setDrawnImageUrl: (url) => set({ drawnImageUrl: url }),
}))
