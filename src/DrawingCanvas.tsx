import { useEffect, useRef } from 'react'

export type DrawTool = 'brush' | 'airbrush' | 'eraser'

type Props = {
  tool: DrawTool
  color: string
  size: number
  opacity: number
  clearSignal: number
}

export default function DrawingCanvas({ tool, color, size, opacity, clearSignal }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget
    const rect = canvas.getBoundingClientRect()
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const snapshot = document.createElement('canvas')
      snapshot.width = canvas.width
      snapshot.height = canvas.height
      snapshot.getContext('2d')?.drawImage(canvas, 0, 0)
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.round(rect.width * devicePixelRatio))
      canvas.height = Math.max(1, Math.round(rect.height * devicePixelRatio))
      canvas.getContext('2d')?.drawImage(snapshot, 0, 0, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
  }, [clearSignal])

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !last.current) return
    const canvas = event.currentTarget
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const next = point(event)
    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = size * devicePixelRatio
    ctx.globalAlpha = tool === 'airbrush' ? opacity * 0.22 : opacity
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
    ctx.strokeStyle = color
    ctx.shadowColor = tool === 'airbrush' ? color : 'transparent'
    ctx.shadowBlur = tool === 'airbrush' ? size * 1.2 * devicePixelRatio : 0
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(next.x, next.y)
    ctx.stroke()
    ctx.restore()
    last.current = next
  }

  return (
    <canvas
      ref={canvasRef}
      className="drawing-canvas"
      aria-label="Freehand artwork layer"
      onPointerDown={(event) => {
        drawing.current = true
        last.current = point(event)
        event.currentTarget.setPointerCapture(event.pointerId)
      }}
      onPointerMove={draw}
      onPointerUp={(event) => {
        draw(event)
        drawing.current = false
        last.current = null
        event.currentTarget.releasePointerCapture(event.pointerId)
      }}
      onPointerCancel={() => {
        drawing.current = false
        last.current = null
      }}
    />
  )
}
