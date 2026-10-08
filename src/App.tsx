import { useState } from 'react'

type PanelId = 'toe' | 'quarter' | 'heel' | 'sole'

const panels: { id: PanelId; label: string }[] = [
  { id: 'toe', label: 'Toe' },
  { id: 'quarter', label: 'Side panel' },
  { id: 'heel', label: 'Heel' },
  { id: 'sole', label: 'Sole' },
]

const initialColors: Record<PanelId, string> = {
  toe: '#f4f4f2',
  quarter: '#ffffff',
  heel: '#ececea',
  sole: '#deded9',
}

export default function App() {
  const [selected, setSelected] = useState<PanelId>('quarter')
  const [colors, setColors] = useState(initialColors)

  const setColor = (color: string) =>
    setColors((current) => ({ ...current, [selected]: color }))

  return (
    <main className="app-shell">
      <header>
        <p className="eyebrow">PHASE 1 · 2D EDITOR</p>
        <h1>Sneaker Design Studio</h1>
        <p>Tap a shoe panel, then choose a color. This is the portable foundation for drawing, image layers, materials, and later 3D preview.</p>
      </header>

      <section className="workspace">
        <div className="canvas-card">
          <div className="shoe" aria-label="Low-top sneaker prototype">
            <button className="panel heel" style={{background: colors.heel}} onClick={() => setSelected('heel')} aria-label="Select heel" />
            <button className="panel quarter" style={{background: colors.quarter}} onClick={() => setSelected('quarter')} aria-label="Select side panel" />
            <button className="panel toe" style={{background: colors.toe}} onClick={() => setSelected('toe')} aria-label="Select toe" />
            <button className="panel sole" style={{background: colors.sole}} onClick={() => setSelected('sole')} aria-label="Select sole" />
            <span className="collar" />
            <span className="laces">╱╲╱╲╱</span>
          </div>
          <p className="hint">Prototype silhouette — original production shoe vectors will replace this shape.</p>
        </div>

        <aside>
          <h2>Panel color</h2>
          <div className="panel-list">
            {panels.map((panel) => (
              <button key={panel.id} className={selected === panel.id ? 'active' : ''} onClick={() => setSelected(panel.id)}>
                {panel.label}
              </button>
            ))}
          </div>
          <label>
            Selected color
            <input type="color" value={colors[selected]} onChange={(event) => setColor(event.target.value)} />
          </label>
          <code>{colors[selected].toUpperCase()}</code>
          <button className="reset" onClick={() => setColors(initialColors)}>Reset colors</button>
        </aside>
      </section>

      <section className="roadmap">
        <strong>Next:</strong> multi-view vector templates · freehand canvas · uploaded artwork · layers · local project saving · material library
      </section>
    </main>
  )
}