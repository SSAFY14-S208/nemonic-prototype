'use client'

import { useEffect, useState } from 'react'
import { useLandingStore } from './landingStore'

export function useWelcome() {
  const [visible, setVisible] = useState(false)
  const onboardingStep = useLandingStore((s) => s.onboardingStep)
  const setOnboardingStep = useLandingStore((s) => s.setOnboardingStep)

  useEffect(() => {
    if (onboardingStep !== 'welcome') return
    setVisible(true)
    const timer = setTimeout(() => {
      setVisible(false)
      setOnboardingStep('drawing')
    }, 2000)
    return () => clearTimeout(timer)
  }, [onboardingStep, setOnboardingStep])

  return { visible }
}
