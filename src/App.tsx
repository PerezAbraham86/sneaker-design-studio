import { useMemo, useState } from 'react'
import { initialColors, panelLabels, panelPaths, type PanelColors, type PanelId } from './shoeTemplate'

type HistoryState = { colors: PanelColors }

const panelOrder = Object.keys(panelLabels) as PanelId[]

function SneakerSvg({
  colors,
  selected,
  onSelect,
}: {
  colors: PanelColors
  selected: PanelId
  onSelect: (panel: PanelId) => void
}) {
  return (
    <svg className="shoe-svg" viewBox="55 55 735 350" role="img" aria-label="Selectable low-top sneaker design template">
      <g className="shoe-shadow"><ellipse cx="430" cy="380" rx="310" ry="12" /></g>
      {(Object.keys(panelPaths) as PanelId[]).map((id) => (
        <path
          key={id}
          d={panelPaths[id]}
          fill={colors[id]}
          className={'shoe-panel' + (selected === id ? ' selected' : '')}
          onClick={() => onSelect(id)}
          tabIndex={0}
          role="button"
          aria-label={'Select ' + panelLabels[id]}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onSelect(id)
            }
          }}
        />
      ))}
      <g className="shoe-details" aria-hidden="true">
        <path d="M328 166 L354 218 M345 158 L370 213 M361 153 L385 207" />
        <path d="M171 185 C188 176 205 176 222 181 M167 202 C187 194 205 194 224 199" />
        <path d="M535 184 C573 179 616 186 647 204" />
        <circle cx="301" cy="150" r="4" /><circle cx="316" cy="144" r="4" /><circle cx="330" cy="139" r="4" />
      </g>
    </svg>
  )
}

export default function App() {
  const [selected, setSelected] = useState<PanelId>('quarter')
  const [colors, setColors] = useState<PanelColors>({ ...initialColors })
  const [past, setPast] = useState<HistoryState[]>([])
  const [future, setFuture] = useState<HistoryState[]>([])

  const currentHex = colors[selected]
  const changedCount = useMemo(
    () => panelOrder.filter((id) => colors[id] !== initialColors[id]).length,
    [colors],
  )

  const commitColors = (next: PanelColors) => {
    setPast((items) => [...items.slice(-39), { colors: { ...colors } }])
    setColors(next)
    setFuture([])
  }

  const setColor = (color: string) => {
    if (color === colors[selected]) return
    commitColors({ ...colors, [selected]: color })
  }

  const undo = () => {
    const previous = past[past.length - 1]
    if (!previous) return
    setFuture((items) => [{ colors: { ...colors } }, ...items].slice(0, 40))
    setColors({ ...previous.colors })
    setPast((items) => items.slice(0, -1))
  }

  const redo = () => {
    const next = future[0]
    if (!next) return
    setPast((items) => [...items.slice(-39), { colors: { ...colors } }])
    setColors({ ...next.colors })
    setFuture((items) => items.slice(1))
  }

  const reset = () => {
    if (changedCount === 0) return
    commitColors({ ...initialColors })
  }

  return (
    <main className="app-shell">
      <header>
        <p className="eyebrow">PHASE 1B · PANEL ENGINE</p>
        <h1>Sneaker Design Studio</h1>
        <p>
          Tap an individual shoe panel to select it, then fill it with any color.
          The template is vector-based so later drawing, image clipping, and 3D mapping can share the same panel identities.
        </p>
      </header>

      <div className="top-actions" aria-label="Design history">
        <button onClick={undo} disabled={!past.length}>↶ Undo</button>
        <button onClick={redo} disabled={!future.length}>↷ Redo</button>
        <span>{changedCount} panel{changedCount === 1 ? '' : 's'} changed</span>
      </div>

      <section className="workspace">
        <div className="canvas-card">
          <div className="view-label">OUTER SIDE · LOW-TOP PROTOTYPE</div>
          <SneakerSvg colors={colors} selected={selected} onSelect={setSelected} />
          <p className="hint">
            Original vector prototype — no brand logos or proprietary artwork are embedded.
          </p>
        </div>

        <aside>
          <div className="selection-heading">
            <div>
              <span className="micro">SELECTED PANEL</span>
              <h2>{panelLabels[selected]}</h2>
            </div>
            <span className="swatch" style={{ background: currentHex }} />
          </div>

          <label className="color-control">
            <span>Fill color</span>
            <input type="color" value={currentHex} onChange={(event) => setColor(event.target.value)} />
          </label>
          <code>{currentHex.toUpperCase()}</code>

          <div className="panel-list" aria-label="Shoe panels">
            {panelOrder.map((panel) => (
              <button
                key={panel}
                className={selected === panel ? 'active' : ''}
                onClick={() => setSelected(panel)}
              >
                {panelLabels[panel]}
                <span className="mini-swatch" style={{ background: colors[panel] }} />
              </button>
            ))}
          </div>

          <button className="reset" onClick={reset} disabled={!changedCount}>Reset all colors</button>
        </aside>
      </section>

      <section className="roadmap">
        <strong>Phase 1B foundation:</strong> 9 addressable vector panels · tap selection · unlimited browser color picker · undo/redo history · responsive touch controls.
        <br />
        <strong>Next editor layer:</strong> freehand drawing canvas, brush/eraser controls, artwork layers, and uploaded-image placement.
      </section>
    </main>
  )
}
