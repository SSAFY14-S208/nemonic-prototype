import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import { LoadingManager, TextureLoader, Vector3 } from 'three'
import type { Group, Mesh, Texture } from 'three'
import { useLandingStore } from '@/features/landing/landingStore'

// DefaultLoadingManager 격리 — useProgress 간섭 방지
const isolatedManager = new LoadingManager()

// 프린터 본체 치수 (PrinterMesh와 동일)
const BW = 1.1
const BH = 0.7
const BD = 1.1

// 프린터 정면 벽 외부면 중심
const ATTACH_POS = new Vector3(0, BH / 2, BD / 2 + 0.004)

// float 시 scale (HUD 기준), attach 시 scale (벽 전체 덮음)
const FLOAT_SCALE = 0.55
const WALL_SCALE = 1.0
// 카메라에서 mesh까지 HUD 거리
const HUD_DISTANCE = 1.5

interface DrawingDoorMeshProps {
  shouldAttach: boolean
  onDoorClick: () => void
}

export default function DrawingDoorMesh({ shouldAttach, onDoorClick }: DrawingDoorMeshProps) {
  const onboardingStep = useLandingStore((s) => s.onboardingStep)
  const drawnImageUrl = useLandingStore((s) => s.drawnImageUrl)

  const groupRef = useRef<Group>(null)
  const meshRef = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const [texture, setTexture] = useState<Texture | null>(null)
  const targetScale = useRef(0)
  const tempVec = useRef(new Vector3())

  // paper-modal 진입 시 텍스처 로드 + float scale 시작
  useEffect(() => {
    if (onboardingStep === 'paper-modal' && drawnImageUrl) {
      targetScale.current = FLOAT_SCALE
      new TextureLoader(isolatedManager).load(drawnImageUrl, (t) => setTexture(t))
    }
    if (onboardingStep !== 'paper-modal' && onboardingStep !== 'entering') {
      targetScale.current = 0
    }
  }, [onboardingStep, drawnImageUrl])

  // shouldAttach 전환 시 wall scale로
  useEffect(() => {
    if (shouldAttach) {
      targetScale.current = WALL_SCALE
    }
  }, [shouldAttach])

  useFrame(({ camera }, delta) => {
    if (!groupRef.current || !meshRef.current) return

    // scale spring
    const s = meshRef.current.scale.x
    const diff = targetScale.current - s
    if (Math.abs(diff) > 0.001) {
      meshRef.current.scale.setScalar(s + diff * Math.min(delta * 6, 1))
    }

    if (!shouldAttach) {
      // HUD 모드: 카메라 중앙 정면에 고정
      tempVec.current.set(0, 0, -HUD_DISTANCE)
      tempVec.current.applyQuaternion(camera.quaternion)
      groupRef.current.position.copy(camera.position).add(tempVec.current)
      // 부유 효과
      groupRef.current.position.y += Math.sin(Date.now() * 0.001) * 0.025
    } else {
      // 벽 부착 모드: ATTACH_POS로 lerp
      groupRef.current.position.lerp(ATTACH_POS, Math.min(delta * 5, 1))
    }
  })

  if (onboardingStep !== 'paper-modal' && onboardingStep !== 'entering') return null

  return (
    <group ref={groupRef}>
      <Billboard>
        <mesh
          ref={meshRef}
          scale={0}
          onClick={!shouldAttach ? onDoorClick : undefined}
          onPointerEnter={() => {
            if (shouldAttach) return
            document.body.style.cursor = 'pointer'
            setHovered(true)
          }}
          onPointerLeave={() => {
            document.body.style.cursor = 'auto'
            setHovered(false)
          }}
        >
          {/* 프린터 정면 벽 크기에 맞춘 플레인 */}
          <planeGeometry args={[BW - 0.04, BH - 0.04]} />
          <meshStandardMaterial
            map={texture ?? undefined}
            color={texture ? 'white' : '#fff8f6'}
            roughness={0.8}
            emissive={hovered ? '#555555' : '#000000'}
            emissiveIntensity={hovered ? 0.12 : 0}
          />
        </mesh>
      </Billboard>
    </group>
  )
}
