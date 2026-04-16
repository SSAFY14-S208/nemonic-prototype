'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { Physics } from '@react-three/rapier'
import SceneManager from './_infra/SceneManager'

export default function WorldCanvas() {
  return (
    <Canvas
      shadows
      camera={{ position: [2.5, 2, 3.5], fov: 50 }}
      style={{ width: '100vw', height: '100vh' }}
      gl={{ antialias: true }}
    >
      <Physics gravity={[0, -9.81, 0]}>
        <Suspense fallback={null}>
          <SceneManager />
        </Suspense>
      </Physics>
    </Canvas>
  )
}
