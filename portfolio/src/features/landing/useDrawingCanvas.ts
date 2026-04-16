'use client'

import { useRef, useState } from 'react'
import type { KonvaEventObject } from 'konva/lib/Node'
import type Konva from 'konva'

interface Line {
  points: number[]
  color: string
  width: number
}

export function useDrawingCanvas() {
  const stageRef = useRef<Konva.Stage>(null)
  const [lines, setLines] = useState<Line[]>([])
  const [currentColor] = useState('#1a1a1a')
  const [currentWidth] = useState(3)
  const isDrawing = useRef(false)

  const handleMouseDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    isDrawing.current = true
    const stage = e.target.getStage()
    const pos = stage?.getPointerPosition()
    if (!pos) return
    setLines((prev) => [...prev, { points: [pos.x, pos.y], color: currentColor, width: currentWidth }])
  }

  const handleMouseMove = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isDrawing.current) return
    const stage = e.target.getStage()
    const pos = stage?.getPointerPosition()
    if (!pos) return
    setLines((prev) => {
      const updated = [...prev]
      const last = updated[updated.length - 1]
      if (!last) return prev
      updated[updated.length - 1] = { ...last, points: [...last.points, pos.x, pos.y] }
      return updated
    })
  }

  const handleMouseUp = () => {
    isDrawing.current = false
  }

  const clearCanvas = () => setLines([])

  const exportImage = (): string | null => {
    if (!stageRef.current) return null
    return stageRef.current.toDataURL({ pixelRatio: 2 })
  }

  return {
    stageRef,
    lines,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    clearCanvas,
    exportImage,
  }
}
