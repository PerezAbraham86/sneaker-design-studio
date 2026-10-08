import { useRef } from 'react'
import type { PanelId } from './shoeTemplate'

export type ArtworkItem = {
  id: string
  src: string
  name: string
  x: number
  y: number
  scale: number
  rotation: number
  opacity: number
  clipPanel?: PanelId | null
}

type Props = {
  items: ArtworkItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  onChange: (id: string, patch: Partial<ArtworkItem>) => void
  clipPaths?: Partial<Record<PanelId,string>>
  viewBox?: string
  mirror?: boolean
}

const parseViewBox = (value = '0 0 800 430') => {
  const [minX = 0, minY = 0, width = 800, height = 430] = value.trim().split(/\s+/).map(Number)
  return { minX, minY, width, height }
}

export default function ArtworkLayer({ items, selectedId, onSelect, onChange, clipPaths, viewBox, mirror }: Props) {
  const drag = useRef<{ id: string; startX: number; startY: number; x: number; y: number } | null>(null)
  const vb = parseViewBox(viewBox)
  // Artwork positions are stored in the CSS design-stage coordinate system.
  // Render clipped artwork in that same 735x350 coordinate space, then map only
  // the panel mask from the shoe SVG viewBox into stage coordinates.
  const stageWidth = 735
  const stageHeight = 350
  const scaleX = stageWidth / vb.width
  const scaleY = stageHeight / vb.height
  const maskTransform = mirror
    ? `translate(${stageWidth} 0) scale(-1 1) translate(${-vb.minX} ${-vb.minY}) scale(${scaleX} ${scaleY})`
    : `translate(${-vb.minX * scaleX} ${-vb.minY * scaleY}) scale(${scaleX} ${scaleY})`

  return (
    <div className="artwork-layer">
      <svg
        className="artwork-mask-svg"
        viewBox={`0 0 ${stageWidth} ${stageHeight}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          {items.map((item) => {
            const d = item.clipPanel ? clipPaths?.[item.clipPanel] : undefined
            if (!d) return null
            return (
              <clipPath key={item.id} id={'artwork-mask-' + item.id} clipPathUnits="userSpaceOnUse">
                <g transform={maskTransform}>
                  <path d={d} />
                </g>
              </clipPath>
            )
          })}
        </defs>
        {items.map((item) => {
          const d = item.clipPanel ? clipPaths?.[item.clipPanel] : undefined
          if (!d) return null
          const width = stageWidth * 0.28 * item.scale
          const height = stageHeight * 0.45 * item.scale
          const x = (item.x / 100) * stageWidth
          const y = (item.y / 100) * stageHeight
          return (
            <image
              key={item.id}
              href={item.src}
              x={x - width / 2}
              y={y - height / 2}
              width={width}
              height={height}
              opacity={item.opacity}
              preserveAspectRatio="xMidYMid meet"
              clipPath={'url(#artwork-mask-' + item.id + ')'}
              transform={'rotate(' + item.rotation + ' ' + x + ' ' + y + ')'}
            />
          )
        })}
      </svg>

      {items.map((item) => {
        const clipped = !!(item.clipPanel && clipPaths?.[item.clipPanel])
        return (
          <img
            key={item.id}
            src={item.src}
            alt={item.name}
            className={'artwork-item' + (selectedId === item.id ? ' selected' : '') + (clipped ? ' clipped-control' : '')}
            draggable={false}
            style={{
              left: item.x + '%',
              top: item.y + '%',
              opacity: clipped ? 0 : item.opacity,
              transform: 'translate(-50%, -50%) rotate(' + item.rotation + 'deg) scale(' + item.scale + ')',
            }}
            onPointerDown={(event) => {
              event.stopPropagation()
              onSelect(item.id)
              drag.current = { id: item.id, startX: event.clientX, startY: event.clientY, x: item.x, y: item.y }
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerMove={(event) => {
              if (!drag.current || drag.current.id !== item.id) return
              const parent = event.currentTarget.parentElement?.getBoundingClientRect()
              if (!parent) return
              onChange(item.id, {
                x: Math.min(100, Math.max(0, drag.current.x + ((event.clientX - drag.current.startX) / parent.width) * 100)),
                y: Math.min(100, Math.max(0, drag.current.y + ((event.clientY - drag.current.startY) / parent.height) * 100)),
              })
            }}
            onPointerUp={() => { drag.current = null }}
          />
        )
      })}
    </div>
  )
}
