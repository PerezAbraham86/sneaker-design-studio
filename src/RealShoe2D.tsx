import type {CSSProperties} from 'react'
import type {PanelColors,PanelId} from './shoeTemplate'
import type {ShoeView} from './project'
const AF1='b580fb8a337e4609807185f1fab2f305'
const PANELS:PanelId[]=['heel','collar','tongue','quarter','eyestay','toeBox','toeGuard','midsole','outsole']
export default function RealShoe2D({view,colors,selected,onSelect,enabled}:{view:ShoeView;colors:PanelColors;selected:PanelId;onSelect:(p:PanelId)=>void;enabled:boolean}){
 if(view!=='outer'&&view!=='inner')return <div className="real-2d-unavailable"><b>{view.toUpperCase()} REAL-SHOE VIEW PENDING</b><span>Switch Real 2D off for the editable vector view at this angle.</span></div>
 return <div className={'real-2d-stage '+(view==='inner'?'mirror':'')}>
  <iframe title={'Air Force 1 Low '+view+' visual'} src={'https://sketchfab.com/models/'+AF1+'/embed?autostart=1&ui_controls=0&ui_infos=0&ui_inspector=0&ui_help=0&transparent=1'} allow="autoplay; fullscreen; xr-spatial-tracking" loading="lazy"/>
  <div className="real-2d-hotspots">{PANELS.map((p,i)=><button key={p} className={'real-hotspot h'+i+(selected===p?' selected':'')} disabled={!enabled} onClick={()=>onSelect(p)} title={p} style={{'--panel':colors[p]} as CSSProperties}/>)}</div>
  <span className="real-2d-badge">REAL SHOE VISUAL · SELECTABLE PANEL OVERLAY</span>
 </div>
}
