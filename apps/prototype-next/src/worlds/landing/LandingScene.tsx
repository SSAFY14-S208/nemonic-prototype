import { useState } from 'react'
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei'
import PrinterMesh from './objects/PrinterMesh'
import DrawingDoorMesh from './objects/DrawingDoorMesh'
import { useLandingStore } from '@/features/landing/landingStore'
import { useSceneStore } from '@/shared/store'
import { useLandingCamera } from './useLandingCamera'

export default function LandingScene() {
  const isExploreMode = useLandingStore((s) => s.isExploreMode)
  const isTransitioning = useSceneStore((s) => s.isTransitioning)
  const setOnboardingStep = useLandingStore((s) => s.setOnboardingStep)

  const { startFront, startSuck } = useLandingCamera()
  const [attachDoor, setAttachDoor] = useState(false)

  const handlePrint = () => {
    setOnboardingStep('printing')
  }

  // 그림 클릭 → 카메라 정면 이동 → 완료 후 그림 벽 부착 → 700ms 후 suck
  const handleDoorClick = () => {
    startFront(() => {
      setAttachDoor(true)
      setTimeout(startSuck, 700)
    })
  }

  return (
    <>
      {/* 카메라 — 온보딩 완료 + 체험 모드에서만 360도 회전 가능 */}
      <OrbitControls
        enabled={isExploreMode && !isTransitioning}
        target={[0, 0.35, 0]}
        enablePan={false}
        enableZoom={true}
        minDistance={2}
        maxDistance={7}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2.1}
        dampingFactor={0.08}
        enableDamping
      />

      {/* 환경 조명 */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[4, 6, 4]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-3, 4, -2]} intensity={0.4} color="#cce4ff" />

      {/* HDR 환경 리플렉션 */}
      <Environment preset="city" />

      {/* 바닥 그림자 */}
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.35}
        scale={5}
        blur={2}
        far={2}
      />

      {/* 네모닉 프린터 메시 */}
      <PrinterMesh onPrint={handlePrint} />

      {/* 드로잉 문 메시 — paper-modal 단계에서 카메라 앞에 떠오름 */}
      <DrawingDoorMesh shouldAttach={attachDoor} onDoorClick={handleDoorClick} />
    </>
  )
}
