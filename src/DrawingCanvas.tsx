import { useRef } from 'react'

export type DrawTool = 'brush' | 'airbrush' | 'eraser'
export type StrokePoint = { x:number; y:number }
export type Stroke = { id:string; tool:DrawTool; color:string; size:number; opacity:number; points:StrokePoint[] }

type Props={tool:DrawTool;color:string;size:number;opacity:number;strokes:Stroke[];onCommit:(stroke:Stroke)=>void}

export default function DrawingCanvas({tool,color,size,opacity,strokes,onCommit}:Props){
 const active=useRef<Stroke|null>(null)
 const svgRef=useRef<SVGSVGElement>(null)
 const point=(e:React.PointerEvent<SVGSVGElement>)=>{const r=e.currentTarget.getBoundingClientRect();return{x:((e.clientX-r.left)/r.width)*1000,y:((e.clientY-r.top)/r.height)*476}}
 const path=(pts:StrokePoint[])=>pts.length<2?'':pts.map((p,i)=>(i?'L':'M')+' '+p.x.toFixed(1)+' '+p.y.toFixed(1)).join(' ')
 const render=(s:Stroke)=>s.tool==='eraser'?null:<path key={s.id} d={path(s.points)} fill="none" stroke={s.color} strokeWidth={s.size} strokeOpacity={s.tool==='airbrush'?s.opacity*.35:s.opacity} strokeLinecap="round" strokeLinejoin="round" filter={s.tool==='airbrush'?'url(#spray)':undefined}/>
 return <svg ref={svgRef} className="drawing-canvas" viewBox="0 0 1000 476" preserveAspectRatio="none"
  onPointerDown={e=>{active.current={id:crypto.randomUUID(),tool,color,size,opacity,points:[point(e)]};e.currentTarget.setPointerCapture(e.pointerId)}}
  onPointerMove={e=>{if(!active.current)return;active.current={...active.current,points:[...active.current.points,point(e)]};e.currentTarget.dataset.live=JSON.stringify(active.current)}}
  onPointerUp={e=>{if(!active.current)return;active.current={...active.current,points:[...active.current.points,point(e)]};if(active.current.points.length>1)onCommit(active.current);active.current=null;delete e.currentTarget.dataset.live;e.currentTarget.releasePointerCapture(e.pointerId)}}
  onPointerCancel={()=>{active.current=null}}>
   <defs><filter id="spray"><feGaussianBlur stdDeviation="4"/></filter></defs>
   {strokes.map(render)}
   <LiveStroke active={active} />
 </svg>
}
function LiveStroke({active}:{active:React.MutableRefObject<Stroke|null>}){
 // Pointer movement mutates the ref for speed; committed vector strokes redraw through React.
 // A tiny transparent marker keeps the SVG layer present during an active gesture.
 return <circle cx="-10" cy="-10" r="1" fill="transparent" data-active={active.current?.id??''}/>
}
