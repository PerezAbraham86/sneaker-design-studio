import { useRef } from 'react'

export type ArtworkItem = {
  id: string
  src: string
  name: string
  x: number
  y: number
  scale: number
  rotation: number
  opacity: number
}

type Props = {
  items: ArtworkItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  onChange: (id: string, patch: Partial<ArtworkItem>) => void
}

export default function ArtworkLayer({ items, selectedId, onSelect, onChange }: Props) {
  const drag = useRef<{ id: string; startX: number; startY: number; x: number; y: number } | null>(null)

  return (
    <div className="artwork-layer">
      {items.map((item) => (
        <img
          key={item.id}
          src={item.src}
          alt={item.name}
          className={'artwork-item' + (selectedId === item.id ? ' selected' : '')}
          draggable={false}
          style={{
            left: item.x + '%',
            top: item.y + '%',
            opacity: item.opacity,
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
      ))}
    </div>
  )
}
