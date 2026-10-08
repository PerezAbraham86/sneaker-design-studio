import { useRef } from 'react'
import type { PanelId } from './shoeTemplate'

export type DrawTool = 'brush' | 'airbrush' | 'eraser'
export type StrokePoint = { x:number; y:number }
export type PaintMaterial='solid'|'pearl'|'metallic'|'interference'|'chameleon'\nexport type Stroke = { id:string; tool:DrawTool; color:string; size:number; opacity:number; points:StrokePoint[]; clipPanel?:PanelId|null; material?:PaintMaterial }

type Props={tool:DrawTool;color:string;size:number;opacity:number;strokes:Stroke[];clipPanel?:PanelId|null;material?:PaintMaterial;clipPaths?:Partial<Record<PanelId,string>>;viewBox?:string;mirror?:boolean;onCommit:(stroke:Stroke)=>void}

const parseViewBox=(value='0 0 800 430')=>{const [minX=0,minY=0,width=800,height=430]=value.trim().split(/\s+/).map(Number);return{minX,minY,width,height}}
export default function DrawingCanvas({tool,color,size,opacity,strokes,clipPanel=null,material='solid',clipPaths,viewBox,mirror,onCommit}:Props){
 const active=useRef<Stroke|null>(null)
 const svgRef=useRef<SVGSVGElement>(null)
 const point=(e:React.PointerEvent<SVGSVGElement>)=>{const r=e.currentTarget.getBoundingClientRect();return{x:((e.clientX-r.left)/r.width)*1000,y:((e.clientY-r.top)/r.height)*476}}
 const path=(pts:StrokePoint[])=>pts.length<2?'':pts.map((p,i)=>(i?'L':'M')+' '+p.x.toFixed(1)+' '+p.y.toFixed(1)).join(' ')
 const vb=parseViewBox(viewBox), sx=1000/vb.width, sy=476/vb.height
 const maskTransform=mirror?`translate(1000 0) scale(-1 1) translate(${-vb.minX} ${-vb.minY}) scale(${sx} ${sy})`:`translate(${-vb.minX*sx} ${-vb.minY*sy}) scale(${sx} ${sy})`
 const paint=(s:Stroke)=>s.material==='chameleon'?'url(#chameleon)':s.material==='interference'?'url(#interference)':s.material==='metallic'?'url(#metallic)':s.material==='pearl'?'url(#pearl)':s.color
 const render=(s:Stroke)=>s.tool==='eraser'?null:<path key={s.id} d={path(s.points)} fill="none" stroke={paint(s)} strokeWidth={s.size} strokeOpacity={s.tool==='airbrush'?s.opacity*.35:s.opacity} strokeLinecap="round" strokeLinejoin="round" filter={s.tool==='airbrush'?'url(#spray)':undefined} mask={s.clipPanel&&clipPaths?.[s.clipPanel]?`url(#paint-mask-${s.id})`:undefined}/>
 return <svg ref={svgRef} className="drawing-canvas" viewBox="0 0 1000 476" preserveAspectRatio="none"
  onPointerDown={e=>{active.current={id:crypto.randomUUID(),tool,color,size,opacity,clipPanel,material,points:[point(e)]};e.currentTarget.setPointerCapture(e.pointerId)}}
  onPointerMove={e=>{if(!active.current)return;active.current={...active.current,points:[...active.current.points,point(e)]};e.currentTarget.dataset.live=JSON.stringify(active.current)}}
  onPointerUp={e=>{if(!active.current)return;active.current={...active.current,points:[...active.current.points,point(e)]};if(active.current.points.length>1)onCommit(active.current);active.current=null;delete e.currentTarget.dataset.live;e.currentTarget.releasePointerCapture(e.pointerId)}}
  onPointerCancel={()=>{active.current=null}}>
   <defs>
    <filter id="spray"><feGaussianBlur stdDeviation="4"/></filter>
    <linearGradient id="pearl"><stop offset="0%" stopColor={color}/><stop offset="48%" stopColor="#ffffff"/><stop offset="62%" stopColor={color}/><stop offset="100%" stopColor={color}/></linearGradient>
    <linearGradient id="metallic"><stop offset="0%" stopColor="#222"/><stop offset="35%" stopColor={color}/><stop offset="52%" stopColor="#fff"/><stop offset="70%" stopColor={color}/><stop offset="100%" stopColor="#333"/></linearGradient>
    <linearGradient id="interference"><stop offset="0%" stopColor={color}/><stop offset="50%" stopColor="#7fffd4"/><stop offset="100%" stopColor="#8a7dff"/></linearGradient>
    <linearGradient id="chameleon"><stop offset="0%" stopColor="#7137ff"/><stop offset="35%" stopColor="#225dff"/><stop offset="68%" stopColor="#00a99d"/><stop offset="100%" stopColor="#45b649"/></linearGradient>
    {strokes.map(s=>{const d=s.clipPanel?clipPaths?.[s.clipPanel]:undefined;if(!d)return null;return <mask key={s.id} id={'paint-mask-'+s.id} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width="1000" height="476"><rect width="1000" height="476" fill="black"/><g transform={maskTransform}><path d={d} fill="white"/></g></mask>})}
   </defs>
   {strokes.map(render)}
   <LiveStroke active={active} />
 </svg>
}
function LiveStroke({active}:{active:React.MutableRefObject<Stroke|null>}){
 // Pointer movement mutates the ref for speed; committed vector strokes redraw through React.
 // A tiny transparent marker keeps the SVG layer present during an active gesture.
 return <circle cx="-10" cy="-10" r="1" fill="transparent" data-active={active.current?.id??''}/>
}
