import {useRef,useState} from 'react'
import ThreeDPreview from './ThreeDPreview'
import OpenSource3DPreview from './OpenSource3DPreview'
import AF1ColorPreview from './AF1ColorPreview'
import {AF1_REGION_LABELS,makeAF1RegionColors,type AF1RegionId} from './af1Regions'
import SneakerReferences from './SneakerReferences'
import RealShoe2D from './RealShoe2D'
import DrawingCanvas,{type DrawTool,type Stroke} from './DrawingCanvas'
import ArtworkLayer,{type ArtworkItem} from './ArtworkLayer'
import {DEFAULT_LAYERS,SHOE_VIEWS,VIEW_LABELS,downloadProject,isProjectFile,loadLocal,makeProject,saveLocal,type LayerId,type LayerState,type ProjectFile,type ShoeView,type ViewDocument} from './project'
import {initialColors,panelLabels,type PanelId} from './shoeTemplate'
import {DEFAULT_SHOE_MODEL_ID,SHOE_MODELS,getShoeModel,modelPanels} from './shoeModels'
import {manifestForModel,partForPanel,partsForView} from './modelManifest'
type Mode='panels'|'draw'|'image'|'layers'|'project';const panelOrder=Object.keys(panelLabels) as PanelId[]
const freshView=():ViewDocument=>({colors:{...initialColors},artworks:[],strokes:[]})
const freshViews=():Record<ShoeView,ViewDocument>=>({outer:freshView(),inner:freshView(),top:freshView(),front:freshView(),heel:freshView()})
export default function App(){
 const [modelId,setModelId]=useState(DEFAULT_SHOE_MODEL_ID),model=getShoeModel(modelId)
 const [referenceImages,setReferenceImages]=useState<Record<string,string>>(()=>{try{const stored=localStorage.getItem('sneaker-studio-reference-images-v1');const parsed:unknown=stored?JSON.parse(stored):{};return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed as Record<string,string>:{} }catch{return {}}})
 const referenceInput=useRef<HTMLInputElement>(null)
 const [useThreeRenderer,setUseThreeRenderer]=useState(true)
 const [af1Colors,setAf1Colors]=useState(makeAF1RegionColors)
 const [af1Selected,setAf1Selected]=useState<AF1RegionId>('tip')
 const [show3D,setShow3D]=useState(true),[showReferences,setShowReferences]=useState(false),[real2D,setReal2D]=useState(false)
 const [mode,setMode]=useState<Mode>('panels'),[activeView,setActiveView]=useState<ShoeView>('outer'),[views,setViews]=useState<Record<ShoeView,ViewDocument>>(freshViews),[selected,setSelected]=useState<PanelId>('quarter')
 const [tool,setTool]=useState<DrawTool>('brush'),[drawColor,setDrawColor]=useState('#111111'),[brushSize,setBrushSize]=useState(10),[drawOpacity,setDrawOpacity]=useState(1),[drawClipPanel,setDrawClipPanel]=useState<PanelId|null>(null),[material,setMaterial]=useState<'solid'|'pearl'|'metallic'|'interference'|'chameleon'>('solid'),[strokeRedo,setStrokeRedo]=useState<Record<ShoeView,Stroke[]>>({outer:[],inner:[],top:[],front:[],heel:[]})
 const [selectedArtwork,setSelectedArtwork]=useState<string|null>(null),[layers,setLayers]=useState<LayerState[]>(DEFAULT_LAYERS),[projectName,setProjectName]=useState('My Sneaker Design'),[status,setStatus]=useState('Not saved yet'),[zoom,setZoom]=useState(1),[pan,setPan]=useState({x:0,y:0})
 const panRef=useRef<{x:number;y:number;px:number;py:number}|null>(null),fileRef=useRef<HTMLInputElement>(null),projectRef=useRef<HTMLInputElement>(null)
 const referenceKey=modelId+'|'+activeView
 const referenceImage=referenceImages[referenceKey]
 const modelManifest=manifestForModel(modelId),selectedPart=partForPanel(modelId,selected),viewParts=partsForView(modelId,activeView)
 const doc=views[activeView],currentArtwork=doc.artworks.find(x=>x.id===selectedArtwork)??null,visible=(id:LayerId)=>layers.find(x=>x.id===id)?.visible!==false
 const patchView=(patch:Partial<ViewDocument>)=>setViews(v=>({...v,[activeView]:{...v[activeView],...patch}}))
 const changeView=(v:ShoeView)=>{setActiveView(v);{const p=modelPanels(model,v);if(!p.includes(selected))setSelected(p[0])}setSelectedArtwork(null);setPan({x:0,y:0});setZoom(1)}
 const updateArtwork=(id:string,patch:Partial<ArtworkItem>)=>patchView({artworks:doc.artworks.map(a=>a.id===id?{...a,...patch}:a)})
 const addReferenceImage=(f:File)=>{if(!['image/png','image/jpeg','image/webp','image/svg+xml'].includes(f.type))return;const key=referenceKey;const reader=new FileReader();reader.onload=()=>{const next={...referenceImages,[key]:String(reader.result)};try{localStorage.setItem('sneaker-studio-reference-images-v1',JSON.stringify(next));setReferenceImages(next);setStatus('Saved template locally for '+key)}catch{setReferenceImages(next);setStatus('Template loaded, but browser storage is full: upload again next visit')}};reader.readAsDataURL(f)}
 const addImage=(f:File)=>{if(!f.type.startsWith('image/'))return;const r=new FileReader();r.onload=()=>{const id=crypto.randomUUID(),item:ArtworkItem={id,src:String(r.result),name:f.name,x:50,y:50,scale:1,rotation:0,opacity:1};patchView({artworks:[...doc.artworks,item]});setSelectedArtwork(id);setMode('image')};r.readAsDataURL(f)}
 const snapshot=()=>makeProject(projectName,modelId,activeView,views,layers),applyProject=(p:ProjectFile)=>{const next=getShoeModel(p.modelId);setModelId(next.id);setProjectName(p.name);setViews(p.views);setLayers(p.layers);setActiveView(p.activeView);const panels=modelPanels(next,p.activeView);setSelected(panels[0]);setSelectedArtwork(null);setZoom(1);setPan({x:0,y:0});setStatus('Loaded '+next.name+' · '+new Date().toLocaleTimeString())}
 const moveLayer=(i:number,d:-1|1)=>{const t=i+d;if(t<0||t>=layers.length)return;setLayers(x=>{const n=[...x];[n[i],n[t]]=[n[t],n[i]];return n})}
 return <main className="app-shell studio-only"><header className="studio-header"><div className="studio-brand">SNEAKER<span>STUDIO</span><small>PRIVATE DESIGN LAB</small></div><nav><a href="#">Home</a><a className="active" href="#studio">3D Configurator</a><a href="#">Gallery</a><a href="#">AI Inspiration</a><a href="#">My Designs</a><a href="#">About</a><a href="#">FAQ</a><a href="#">Contact</a></nav><button className="save-design">Save Design</button></header><section id="studio" className="studio-stage">show3D&&modelId==='classic-low-top'?<AF1ColorPreview colors={af1Colors} selected={af1Selected} onSelect={setAf1Selected} onColorChange={(id,color)=>setAf1Colors(v=>({...v,[id]:color}))} onReset={()=>setAf1Colors(makeAF1RegionColors())}/></section></main>
}