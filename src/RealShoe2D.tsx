import type {PanelColors,PanelId} from './shoeTemplate'
import type {ShoeView} from './project'
const AF1='b580fb8a337e4609807185f1fab2f305'
const HIT:Record<PanelId,string>={heel:'18% 34% 19% 29%',collar:'27% 25% 19% 16%',tongue:'38% 24% 15% 31%',quarter:'39% 39% 28% 27%',eyestay:'34% 33% 17% 29%',toeBox:'59% 43% 25% 25%',toeGuard:'66% 54% 25% 18%',midsole:'28% 66% 57% 14%',outsole:'26% 78% 61% 11%'}
export default function RealShoe2D({view,colors,selected,onSelect,enabled}:{view:ShoeView;colors:PanelColors;selected:PanelId;onSelect:(p:PanelId)=>void;enabled:boolean}){
 if(view!=='outer'&&view!=='inner')return <div className="real-2d-unavailable"><b>{view.toUpperCase()} REAL-SHOE VIEW PENDING</b><span>Switch Real 2D off for the editable vector view at this angle.</span></div>
 return <div className={'real-2d-stage '+(view==='inner'?'mirror':'')}>
  <iframe title={'Air Force 1 Low '+view+' visual'} src={'https://sketchfab.com/models/'+AF1+'/embed?autostart=1&ui_controls=0&ui_infos=0&ui_inspector=0&ui_help=0&transparent=1'} allow="autoplay; fullscreen; xr-spatial-tracking" loading="lazy"/>
  <div className="real-2d-hitareas">{(Object.keys(HIT) as PanelId[]).map(p=>{const [left,top,width,height]=HIT[p].split(' ');return <button key={p} aria-label={'Select '+p} className={'real-hitarea '+(selected===p?'selected':'')} disabled={!enabled} onClick={()=>onSelect(p)} title={p} style={{left,top,width,height}}><span>{p}</span></button>})}</div>
  <span className="real-2d-badge">REAL SHOE DESIGN VIEW · TAP A SHOE REGION</span>
 </div>
}
