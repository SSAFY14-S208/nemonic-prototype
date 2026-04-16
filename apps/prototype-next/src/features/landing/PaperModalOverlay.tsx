'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useLandingStore } from './landingStore'

export default function PaperModalOverlay() {
  const onboardingStep = useLandingStore((s) => s.onboardingStep)

  return (
    <AnimatePresence>
      {onboardingStep === 'paper-modal' && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="absolute inset-0 flex flex-col items-center justify-start pt-12 z-20 pointer-events-none"
        >
          {/* 안내 텍스트 */}
          <motion.p
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
            className="text-white text-2xl font-semibold drop-shadow-lg select-none"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
          >
            문을 달아 네모닉 월드로 들어가봐요!
          </motion.p>

          {/* 클릭 힌트 */}
          <motion.p
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="mt-3 text-white/70 text-sm select-none"
          >
            그림을 클릭하세요
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
