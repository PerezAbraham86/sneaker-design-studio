import { useMemo, useRef, useState } from 'react'
import DrawingCanvas, { type DrawTool } from './DrawingCanvas'
import ArtworkLayer, { type ArtworkItem } from './ArtworkLayer'
import { initialColors, panelLabels, panelPaths, type PanelColors, type PanelId } from './shoeTemplate'

type Mode = 'panels' | 'draw' | 'image'
type HistoryState = { colors: PanelColors }
const panelOrder = Object.keys(panelLabels) as PanelId[]

function SneakerSvg({ colors, selected, onSelect, enabled }: { colors: PanelColors; selected: PanelId; onSelect:(p:PanelId)=>void; enabled:boolean }) {
  return <svg className="shoe-svg" viewBox="55 55 735 350" role="img" aria-label="Selectable low-top sneaker">
    <g className="shoe-shadow"><ellipse cx="430" cy="380" rx="310" ry="12"/></g>
    {(Object.keys(panelPaths) as PanelId[]).map(id => <path key={id} d={panelPaths[id]} fill={colors[id]}
      className={'shoe-panel'+(selected===id&&enabled?' selected':'')} onClick={()=>enabled&&onSelect(id)} />)}
    <g className="shoe-details" aria-hidden="true">
      <path d="M328 166 L354 218 M345 158 L370 213 M361 153 L385 207"/>
      <path d="M171 185 C188 176 205 176 222 181 M167 202 C187 194 205 194 224 199"/>
      <path d="M535 184 C573 179 616 186 647 204"/>
      <circle cx="301" cy="150" r="4"/><circle cx="316" cy="144" r="4"/><circle cx="330" cy="139" r="4"/>
    </g>
  </svg>
}

export default function App(){
  const [mode,setMode]=useState<Mode>('panels')
  const [selected,setSelected]=useState<PanelId>('quarter')
  const [colors,setColors]=useState<PanelColors>({...initialColors})
  const [past,setPast]=useState<HistoryState[]>([])
  const [future,setFuture]=useState<HistoryState[]>([])
  const [tool,setTool]=useState<DrawTool>('brush')
  const [drawColor,setDrawColor]=useState('#111111')
  const [brushSize,setBrushSize]=useState(10)
  const [drawOpacity,setDrawOpacity]=useState(1)
  const [clearSignal,setClearSignal]=useState(0)
  const [artworks,setArtworks]=useState<ArtworkItem[]>([])
  const [selectedArtwork,setSelectedArtwork]=useState<string|null>(null)
  const fileRef=useRef<HTMLInputElement>(null)
  const currentArtwork=artworks.find(x=>x.id===selectedArtwork)??null
  const changedCount=useMemo(()=>panelOrder.filter(id=>colors[id]!==initialColors[id]).length,[colors])

  const commitColors=(next:PanelColors)=>{setPast(x=>[...x.slice(-39),{colors:{...colors}}]);setColors(next);setFuture([])}
  const setPanelColor=(color:string)=>{if(color!==colors[selected])commitColors({...colors,[selected]:color})}
  const undo=()=>{const p=past[past.length-1];if(!p)return;setFuture(x=>[{colors:{...colors}},...x].slice(0,40));setColors({...p.colors});setPast(x=>x.slice(0,-1))}
  const redo=()=>{const n=future[0];if(!n)return;setPast(x=>[...x.slice(-39),{colors:{...colors}}]);setColors({...n.colors});setFuture(x=>x.slice(1))}
  const updateArtwork=(id:string,patch:Partial<ArtworkItem>)=>setArtworks(items=>items.map(item=>item.id===id?{...item,...patch}:item))
  const addImage=(file:File)=>{
    if(!file.type.startsWith('image/'))return
    const reader=new FileReader()
    reader.onload=()=>{const id=crypto.randomUUID();setArtworks(x=>[...x,{id,src:String(reader.result),name:file.name,x:50,y:50,scale:1,rotation:0,opacity:1}]);setSelectedArtwork(id);setMode('image')}
    reader.readAsDataURL(file)
  }

  return <main className="app-shell">
    <header><p className="eyebrow">PHASE 1C · ARTWORK STUDIO</p><h1>Sneaker Design Studio</h1>
      <p>Color individual panels, draw freehand over the shoe, or upload artwork and position it directly on the design.</p></header>

    <nav className="mode-tabs" aria-label="Editor mode">
      <button className={mode==='panels'?'active':''} onClick={()=>setMode('panels')}>▧ Panel color</button>
      <button className={mode==='draw'?'active':''} onClick={()=>setMode('draw')}>✎ Freehand</button>
      <button className={mode==='image'?'active':''} onClick={()=>setMode('image')}>▣ Images</button>
    </nav>

    <section className="workspace">
      <div className="canvas-card">
        <div className="view-label">OUTER SIDE · LOW-TOP PROTOTYPE</div>
        <div className="design-stage">
          <SneakerSvg colors={colors} selected={selected} onSelect={setSelected} enabled={mode==='panels'}/>
          <ArtworkLayer items={artworks} selectedId={mode==='image'?selectedArtwork:null} onSelect={setSelectedArtwork} onChange={updateArtwork}/>
          <div className={'draw-layer '+(mode==='draw'?'enabled':'disabled')}><DrawingCanvas tool={tool} color={drawColor} size={brushSize} opacity={drawOpacity} clearSignal={clearSignal}/></div>
        </div>
        <p className="hint">{mode==='draw'?'Draw with your finger, mouse, or stylus.':mode==='image'?'Drag uploaded artwork directly across the shoe.':'Tap a shoe panel to recolor it.'}</p>
      </div>

      <aside>
        {mode==='panels' && <>
          <span className="micro">SELECTED PANEL</span><h2>{panelLabels[selected]}</h2>
          <label className="color-control"><span>Fill color</span><input type="color" value={colors[selected]} onChange={e=>setPanelColor(e.target.value)}/></label>
          <code>{colors[selected].toUpperCase()}</code>
          <div className="panel-list">{panelOrder.map(p=><button key={p} className={selected===p?'active':''} onClick={()=>setSelected(p)}>{panelLabels[p]}<span className="mini-swatch" style={{background:colors[p]}}/></button>)}</div>
          <div className="history-row"><button onClick={undo} disabled={!past.length}>↶ Undo</button><button onClick={redo} disabled={!future.length}>↷ Redo</button></div>
          <button className="reset" onClick={()=>changedCount&&commitColors({...initialColors})} disabled={!changedCount}>Reset panel colors</button>
        </>}

        {mode==='draw' && <>
          <span className="micro">FREEHAND TOOLS</span><h2>Paint layer</h2>
          <div className="tool-grid">{(['brush','airbrush','eraser'] as DrawTool[]).map(t=><button key={t} className={tool===t?'active':''} onClick={()=>setTool(t)}>{t==='brush'?'Brush':t==='airbrush'?'Airbrush':'Eraser'}</button>)}</div>
          <label className="control-row">Paint color<input type="color" value={drawColor} onChange={e=>setDrawColor(e.target.value)}/></label>
          <label className="slider-label">Brush size <b>{brushSize}px</b><input type="range" min="2" max="60" value={brushSize} onChange={e=>setBrushSize(+e.target.value)}/></label>
          <label className="slider-label">Opacity <b>{Math.round(drawOpacity*100)}%</b><input type="range" min="10" max="100" value={drawOpacity*100} onChange={e=>setDrawOpacity(+e.target.value/100)}/></label>
          <button className="reset" onClick={()=>setClearSignal(x=>x+1)}>Clear freehand layer</button>
        </>}

        {mode==='image' && <>
          <span className="micro">IMAGE ARTWORK</span><h2>Uploaded artwork</h2>
          <input ref={fileRef} className="file-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const f=e.target.files?.[0];if(f)addImage(f);e.target.value=''}}/>
          <button className="primary" onClick={()=>fileRef.current?.click()}>+ Upload image</button>
          {artworks.length>0 && <div className="artwork-list">{artworks.map(a=><button key={a.id} className={selectedArtwork===a.id?'active':''} onClick={()=>setSelectedArtwork(a.id)}>{a.name}</button>)}</div>}
          {currentArtwork && <div className="image-controls">
            <label className="slider-label">Size <b>{Math.round(currentArtwork.scale*100)}%</b><input type="range" min="20" max="250" value={currentArtwork.scale*100} onChange={e=>updateArtwork(currentArtwork.id,{scale:+e.target.value/100})}/></label>
            <label className="slider-label">Rotation <b>{currentArtwork.rotation}°</b><input type="range" min="-180" max="180" value={currentArtwork.rotation} onChange={e=>updateArtwork(currentArtwork.id,{rotation:+e.target.value})}/></label>
            <label className="slider-label">Opacity <b>{Math.round(currentArtwork.opacity*100)}%</b><input type="range" min="10" max="100" value={currentArtwork.opacity*100} onChange={e=>updateArtwork(currentArtwork.id,{opacity:+e.target.value/100})}/></label>
            <button className="danger" onClick={()=>{setArtworks(x=>x.filter(a=>a.id!==currentArtwork.id));setSelectedArtwork(null)}}>Remove image</button>
          </div>}
        </>}
      </aside>
    </section>
    <section className="roadmap"><strong>Working now:</strong> panel fill · brush · airbrush · eraser · brush size/opacity · image upload · drag · resize · rotate · image opacity.<br/><strong>Next:</strong> true layer manager, local project save/load, image clipping/warp, zoom/pan, and multi-view shoe templates.</section>
  </main>
}
