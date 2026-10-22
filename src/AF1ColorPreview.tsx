import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useLoader, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import StudioOrbitControls from './StudioOrbitControls'
import { useDesignHistory } from './useDesignHistory'
import * as THREE from 'three'
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js'
import { applyPaint, makePaintMaterial, CHAMELEON_PRESETS } from './af1Paint'
import { AF1_REGION_GROUPS, AF1_REGION_LABELS, type AF1RegionColors, type AF1RegionId } from './af1Regions'
import {PATTERNS,defaultPattern,makePatternCanvas,makePatternTexture,type PatternId,type PatternMap,type RegionPattern} from './af1Patterns'

const MODEL_URL='/models/AF1-16regions(2).glb'
const normalizeName=(name:string)=>name.toLowerCase().replace(/[^a-z0-9]/g,'')
const REGION_BY_MESH:Record<string,AF1RegionId>={tip:'tip',vamp:'vamp',eyestay:'eyestay',quarterleft:'quarterLeft',quarterright:'quarterRight',swooshleft:'swooshLeft',swooshright:'swooshRight',tongue:'tongue',laces:'laces',liningleft:'liningLeft',liningright:'liningRight',backtab:'backtab',midsole:'midsole',midsolestripe:'midsoleStripe',midsolelogo:'midsoleLogo',outsole:'outsole'}

type FreeProjection={position:[number,number,number];rotation:[number,number,number,number];width:number;height:number;depth:number}
type DrawStroke={tool:'brush'|'eraser';color:string;size:number;points:[number,number][]}
type Artwork3D={originalSrc?:string;strokes?:DrawStroke[];src:string;name:string;size:number;x:number;y:number;rotation:number;aspect:number;mode?:'single'|'multiple'|'free';regions?:AF1RegionId[];freeProjection?:FreeProjection}
type ArtworkMap=Partial<Record<AF1RegionId,Artwork3D>>
type SurfaceMark={region:AF1RegionId;position:[number,number,number];normal:[number,number,number];color:string;size:number}
type SurfaceStroke={marks:SurfaceMark[]}
type FinishGroup='classic'|'matte'|'metallic'|'metals'|'pearlescent'|'chameleon'|'chrome'
type FinishState={primary:string;secondary:string;group:FinishGroup}
type FinishMap=Record<AF1RegionId,FinishState>
const FINISH_GROUPS:{id:FinishGroup;label:string}[]=[
 {id:'classic',label:'Classic'},{id:'matte',label:'Matte'},{id:'metallic',label:'Metallic'},
 {id:'metals',label:'Metals'},{id:'pearlescent',label:'Pearlescent'},{id:'chameleon',label:'Chameleon'},{id:'chrome',label:'Chrome'}
]
const validHex=(v:string)=>/^#[0-9a-fA-F]{6}$/.test(v)
const makeFinishes=(colors:AF1RegionColors)=>Object.fromEntries(Object.entries(colors).map(([id,color])=>[id,{primary:color,secondary:'#5b7cff',group:'classic'}])) as FinishMap

function regionForObject(object:THREE.Object3D):AF1RegionId|undefined{let current:THREE.Object3D|null=object;while(current){const region=REGION_BY_MESH[normalizeName(current.name)];if(region)return region;current=current.parent}}

function RegionDecal({target,anchor,art,region}:{target:THREE.Mesh;anchor:THREE.Mesh;art:Artwork3D;region:AF1RegionId}){
 const texture=useLoader(THREE.TextureLoader,art.src)
 useEffect(()=>{texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true},[texture])
 const geometry=useMemo(()=>{
   // DecalGeometry expects WORLD-space projection coordinates; the GLB meshes
   // are nested under a translated/scaled parent and have LOCAL bounding boxes.
   anchor.updateWorldMatrix(true,false)
   target.updateWorldMatrix(true,false)
   const bounds=new THREE.Box3().setFromObject(anchor)
   const center=bounds.getCenter(new THREE.Vector3())
   const extent=bounds.getSize(new THREE.Vector3())
   const largest=Math.max(extent.x,extent.y,extent.z,.01)
   const offset=new THREE.Vector3(art.x/100*extent.x*.35,art.y/100*extent.y*.35,0)
   const aim=center.clone().add(offset)
   // Choose a real face on this particular panel, rather than assuming the
   // panel faces the camera or that the box center is on the shoe surface.
   const directions=[
     new THREE.Vector3(0,0,1),new THREE.Vector3(1,0,0),
     new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,-1),
     new THREE.Vector3(-1,0,0),new THREE.Vector3(0,-1,0)
   ]
   const raycaster=new THREE.Raycaster()
   let hit:THREE.Intersection<THREE.Object3D>|undefined
   let outward=new THREE.Vector3(0,0,1)
   const materials=Array.isArray(target.material)?target.material:[target.material]
   const sides=materials.map(m=>m.side)
   materials.forEach(m=>{m.side=THREE.DoubleSide})
   try{
     for(const direction of directions){
       const origin=aim.clone().addScaledVector(direction,largest*3+1)
       raycaster.set(origin,direction.clone().negate())
       const candidate=raycaster.intersectObject(anchor,false)[0]
       if(candidate){hit=candidate;outward=direction;break}
     }
   }finally{materials.forEach((m,i)=>{m.side=sides[i]})}
   const position=art.mode==='free'&&art.freeProjection?new THREE.Vector3(...art.freeProjection.position):hit?hit.point.clone():aim
   const normal=hit?.face?.normal.clone().transformDirection(anchor.matrixWorld).normalize()??outward
   if(normal.dot(outward)<0)normal.negate()
   const rotation=new THREE.Euler().setFromQuaternion(
     art.mode==='free'&&art.freeProjection?new THREE.Quaternion(...art.freeProjection.rotation):new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),normal)
   )
   if(art.mode!=='free'||!art.freeProjection)rotation.z+=THREE.MathUtils.degToRad(art.rotation)
   const aspect=Math.max(art.aspect,.01)
   // Fit to the two longest dimensions of the actual world-space region.
   const axes=[extent.x,extent.y,extent.z].sort((a,b)=>b-a)
   const panelWidth=Math.max(axes[0]*.8,.08)
   const panelHeight=Math.max(axes[1]*1.5,.08)
   const width=art.mode==='free'&&art.freeProjection?art.freeProjection.width:Math.min(panelWidth,panelHeight*aspect)*art.size
   const height=art.mode==='free'&&art.freeProjection?art.freeProjection.height:width/aspect
   const depth=Math.max(largest*.65,.08)
   position.addScaledVector(normal,.002)
   // Sole meshes wrap around the entire shoe. A deep box projects through
   // their far/underside faces and creates duplicate or stretched artwork.
   const soleRegion=(['midsole','midsoleStripe','midsoleLogo','outsole'] as AF1RegionId[]).includes(region)
   const projectionDepth=art.mode==='free'&&art.freeProjection?art.freeProjection.depth:art.mode==='single'||!art.mode?depth:soleRegion?Math.max(Math.min(depth,largest*.4),.08):Math.max(depth,largest*2)
   const decal=new DecalGeometry(target,position,rotation,new THREE.Vector3(width,height,projectionDepth))
   if(soleRegion||(art.mode==='free'&&art.freeProjection)){
     const verts=decal.getAttribute('position')
     const normals=decal.getAttribute('normal')
     const uv=decal.getAttribute('uv')
     const indices:number[]=[]
     // Preserve only the side facing the image projector, not its opposite
     // side or the lower sole that would otherwise receive a ghost image.
     const facing=art.mode==='free'&&art.freeProjection?new THREE.Vector3(0,0,1).applyQuaternion(new THREE.Quaternion(...art.freeProjection.rotation)):normal.clone().normalize()
     for(let i=0;i<verts.count;i+=3){
       const nx=(normals.getX(i)+normals.getX(i+1)+normals.getX(i+2))/3
       const ny=(normals.getY(i)+normals.getY(i+1)+normals.getY(i+2))/3
       const nz=(normals.getZ(i)+normals.getZ(i+1)+normals.getZ(i+2))/3
       const localNormal=new THREE.Vector3(nx,ny,nz).transformDirection(target.matrixWorld)
       if(localNormal.dot(facing)>.15)indices.push(i,i+1,i+2)
     }
     decal.setIndex(indices)
     // DecalGeometry is non-indexed; an index selects safe visible triangles
     // while retaining its original UV mapping and artwork proportions.
     void uv
   }
   // These GLB regions project from an inverted facing direction.
   // Flip the UVs only so uploaded text and logos stay readable.
   if(!(art.mode==='free'&&art.freeProjection)&&(['tip','vamp','quarterLeft','swooshLeft','tongue'] as AF1RegionId[]).includes(region)){
     const uv=decal.getAttribute('uv')
     for(let i=0;i<uv.count;i++)uv.setX(i,1-uv.getX(i))
     uv.needsUpdate=true
   }
   return decal
 },[target,anchor,region,art.x,art.y,art.size,art.rotation,art.aspect,art.mode,art.freeProjection])
 useEffect(()=>()=>geometry.dispose(),[geometry])
 return <mesh geometry={geometry} renderOrder={10}><meshBasicMaterial map={texture} transparent alphaTest={.02} depthTest depthWrite={false} polygonOffset polygonOffsetFactor={-8} toneMapped={false} side={THREE.DoubleSide}/></mesh>
}
type PlacementFrame={x:number;y:number;width:number;height:number}
type PlacementRequest={id:AF1RegionId;frame:PlacementFrame;serial:number}
function FreePlacementProjector({model,request,onProject}:{model:THREE.Object3D;request:PlacementRequest|null;onProject:(id:AF1RegionId,p:FreeProjection|null)=>void}){
 const {camera,gl}=useThree()
 useEffect(()=>{
   if(!request)return
   const rect=gl.domElement.getBoundingClientRect()
   const {frame,id}=request
   const px=rect.left+rect.width*(frame.x+frame.width/2)/100
   const py=rect.top+rect.height*(frame.y+frame.height/2)/100
   const cursor=new THREE.Vector2((px-rect.left)/rect.width*2-1,-((py-rect.top)/rect.height*2-1))
   const raycaster=new THREE.Raycaster()
   raycaster.setFromCamera(cursor,camera)
   model.updateWorldMatrix(true,true)
   const hit=raycaster.intersectObject(model,true).find(item=>regionForObject(item.object))
   if(!hit){onProject(id,null);return}
   const distance=camera.position.distanceTo(hit.point)
   const perspective=camera as THREE.PerspectiveCamera
   const visibleHeight=perspective.isPerspectiveCamera?2*distance*Math.tan(THREE.MathUtils.degToRad(perspective.fov)/2):3.5
   const width=visibleHeight*rect.width/rect.height*frame.width/100
   const height=visibleHeight*frame.height/100
   const p:FreeProjection={
     position:hit.point.toArray() as [number,number,number],
     rotation:camera.quaternion.toArray() as [number,number,number,number],
     width,height,depth:Math.max(.4,distance*.7)
   }
   onProject(id,p)
 },[camera,gl,model,request,onProject])
 return null
}
function SurfaceBrushDot({target,mark}:{target:THREE.Mesh;mark:SurfaceMark}){
 const geometry=useMemo(()=>{
  target.updateWorldMatrix(true,false)
  const normal=new THREE.Vector3(...mark.normal).normalize()
  const orientation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),normal)
  const rotation=new THREE.Euler().setFromQuaternion(orientation)
  const position=new THREE.Vector3(...mark.position).addScaledVector(normal,.002)
  const radius=mark.size/160
  return new DecalGeometry(target,position,rotation,new THREE.Vector3(radius,radius,Math.max(radius*.8,.025)))
 },[target,mark])
 useEffect(()=>()=>geometry.dispose(),[geometry])
 return <mesh geometry={geometry} renderOrder={20}><meshBasicMaterial color={mark.color} side={THREE.DoubleSide} transparent opacity={1} depthWrite={false} polygonOffset polygonOffsetFactor={-12}/></mesh>
}
function RealAF1({colors,onSelect,artworks,finishes,patterns,placementRequest,onProject,shoeDraw,onSurfaceDown,onSurfaceMove,onSurfaceUp,surfaceStrokes,activeSurface}:{colors:AF1RegionColors;onSelect:(id:AF1RegionId)=>void;artworks:ArtworkMap;finishes:FinishMap;patterns:PatternMap;placementRequest:PlacementRequest|null;onProject:(id:AF1RegionId,p:FreeProjection|null)=>void;shoeDraw:boolean;onSurfaceDown:(e:any)=>void;onSurfaceMove:(e:any)=>void;onSurfaceUp:()=>void;surfaceStrokes:SurfaceStroke[];activeSurface:SurfaceMark[]}){
 const {scene}=useGLTF(MODEL_URL)
 const model=useMemo(()=>{
  const root=scene.clone(true)
  root.traverse(object=>{if(object instanceof THREE.Mesh)object.material=Array.isArray(object.material)?object.material.map(makePaintMaterial):makePaintMaterial(object.material)})
  const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3())
  root.position.sub(center);root.scale.setScalar(3.5/Math.max(size.x,size.y,size.z,.001));root.updateMatrixWorld(true);return root
 },[scene])
 const regionMeshes=useMemo(()=>{const found={} as Partial<Record<AF1RegionId,THREE.Mesh>>;model.traverse(o=>{if(o instanceof THREE.Mesh){const r=regionForObject(o);if(r&&!found[r])found[r]=o}});return found},[model])
 useEffect(()=>{model.traverse(object=>{if(!(object instanceof THREE.Mesh))return;const region=regionForObject(object);if(!region)return;const ms=Array.isArray(object.material)?object.material:[object.material];ms.forEach(m=>applyPaint(m,finishes[region]))})},[model,colors,finishes])
 const [textureImages,setTextureImages]=useState<Partial<Record<'bandana'|'digitalCamo'|'leopard'|'ggSupreme'|'splatter'|'splatterBW'|'splatterBlue'|'fallCamoWoodland'|'fallCamoLeaves'|'tiger'|'zebra',HTMLImageElement>>>({})
 useEffect(()=>{let cancelled=false;const sources=[['bandana','/textures/bandana-paisley.png'],['digitalCamo','/textures/digital-camo.png'],['leopard','/textures/leopard.png'],['ggSupreme','/textures/gg-monogram.jpg'],['splatter','/textures/paint-splatter-colorful.png'],['splatterBW','/textures/paint-splatter-bw.jpg'],['splatterBlue','/textures/paint-splatter-blue.png'],['fallCamoWoodland','/textures/fall-camo-woodland.png'],['fallCamoLeaves','/textures/fall-camo-leaves.png'],['tiger','/textures/tiger.png'],['zebra','/textures/Zebra.png']] as const
  sources.forEach(([id,url])=>{const img=new Image();img.onload=()=>{if(!cancelled)setTextureImages(prev=>({...prev,[id]:img}))};img.onerror=()=>console.warn('Texture image could not be loaded:',url);img.src=url})
  return()=>{cancelled=true}
 },[])
 const patternTextures=useMemo(()=>Object.fromEntries(Object.entries(patterns).filter(([,p])=>p&&p.id!=='none').map(([id,p])=>[id,makePatternTexture(p!,p!.id==='bandana'?textureImages.bandana:p!.id==='digitalCamo'?textureImages.digitalCamo:p!.id==='leopard'?textureImages.leopard:p!.id==='ggSupreme'?textureImages.ggSupreme:p!.id==='splatter'?textureImages.splatter:p!.id==='splatterBW'?textureImages.splatterBW:p!.id==='splatterBlue'?textureImages.splatterBlue:p!.id==='fallCamoWoodland'?textureImages.fallCamoWoodland:p!.id==='fallCamoLeaves'?textureImages.fallCamoLeaves:p!.id==='tiger'?textureImages.tiger:p!.id==='zebra'?textureImages.zebra:undefined)])) as Partial<Record<AF1RegionId,THREE.CanvasTexture>>,[patterns,textureImages])
 useEffect(()=>{
  model.traverse(object=>{if(!(object instanceof THREE.Mesh))return;const region=regionForObject(object);if(!region)return
   const maps=Array.isArray(object.material)?object.material:[object.material]
   maps.forEach(m=>{if(!(m instanceof THREE.MeshStandardMaterial))return;const tex=patternTextures[region];m.map=tex??null;m.color.set(tex?'#ffffff':finishes[region].primary);m.needsUpdate=true})
  })
 },[model,patternTextures])
 useEffect(()=>()=>Object.values(patternTextures).forEach(t=>t?.dispose()),[patternTextures])
 useEffect(()=>()=>{model.traverse(o=>{if(o instanceof THREE.Mesh){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose())}})},[model])
 return <group><FreePlacementProjector model={model} request={placementRequest} onProject={onProject}/><primitive object={model} onPointerDown={(e:any)=>{if(shoeDraw){e.stopPropagation();onSurfaceDown(e);return}const hit=e.intersections?.[0]?.object as THREE.Object3D|undefined;if(!hit)return;const r=regionForObject(hit);if(r){e.stopPropagation();onSelect(r)}}} onPointerMove={(e:any)=>{if(shoeDraw)onSurfaceMove(e)}} onPointerUp={onSurfaceUp} onPointerMissed={onSurfaceUp}/>{Object.entries(artworks).flatMap(([id,art])=>{
   const anchor=regionMeshes[id as AF1RegionId]
   if(!anchor||!art||(art.mode==='free'&&!art.freeProjection))return []
   const regions=art.mode==='free'?Object.keys(regionMeshes) as AF1RegionId[]:art.mode==='multiple'&&art.regions?.length?art.regions:[id as AF1RegionId]
   return regions.flatMap(region=>{const target=regionMeshes[region];return target?[<RegionDecal key={id+'-'+region} anchor={anchor} target={target} art={art} region={region}/>]:[]})
 })}{surfaceStrokes.flatMap((stroke,i)=>stroke.marks.map((mark,j)=>{const target=regionMeshes[mark.region];return target?<SurfaceBrushDot key={'paint-'+i+'-'+j} target={target} mark={mark}/>:null}))}{activeSurface.map((mark,j)=>{const target=regionMeshes[mark.region];return target?<SurfaceBrushDot key={'active-'+j} target={target} mark={mark}/>:null})}</group>
}

type Props={colors:AF1RegionColors;selected:AF1RegionId;onSelect:(id:AF1RegionId)=>void;onColorChange:(id:AF1RegionId,color:string)=>void;onReset:()=>void}

export default function AF1ColorPreview({colors,selected,onSelect,onColorChange,onReset}:Props){
 const label=AF1_REGION_LABELS[selected],fileRef=useRef<HTMLInputElement>(null)
 const palette=['#ffffff','#111111','#9ca3af','#d1d5db','#ff321c','#ff6b00','#ffb000','#ffd500','#39e600','#38c6d4','#2563eb','#7c22e8','#f52a87','#9a4c16','#c99d69','#f6dec3','#fffde5','#b8f5cb','#b9ddf5','#c9b6f4','#e5b7f3','#f2bfd7','#17172f','#11254a','#0d4176','#5c3c91','#ed4058','#2ac783','#ff9600','#ef4937']
 const [artworks,setArtworks]=useState<ArtworkMap>({})
 const [placementMode,setPlacementMode]=useState<'single'|'multiple'|'free'>('single')
 const [freeEdit,setFreeEdit]=useState<AF1RegionId|null>(null)
 const [drawMode,setDrawMode]=useState(false)
 const [shoeDraw,setShoeDraw]=useState(false)
 const [surfaceStrokes,setSurfaceStrokes]=useState<SurfaceStroke[]>([])
 const [activeSurface,setActiveSurface]=useState<SurfaceMark[]>([])
 const surfaceRef=useRef<SurfaceMark[]>([])
 const paintingRef=useRef(false)
 const [brushTool,setBrushTool]=useState<'brush'|'eraser'>('brush')
 const [brushColor,setBrushColor]=useState('#000000')
 const [brushSize,setBrushSize]=useState(12)
 const drawCanvas=useRef<HTMLCanvasElement>(null)
 const drawing=useRef<DrawStroke|null>(null)
 const [shiftHeld,setShiftHeld]=useState(false)
 useEffect(()=>{const onDown=(e:KeyboardEvent)=>{if(e.key==='Shift')setShiftHeld(true)},onUp=(e:KeyboardEvent)=>{if(e.key==='Shift')setShiftHeld(false)},onBlur=()=>setShiftHeld(false);window.addEventListener('keydown',onDown);window.addEventListener('keyup',onUp);window.addEventListener('blur',onBlur);return()=>{window.removeEventListener('keydown',onDown);window.removeEventListener('keyup',onUp);window.removeEventListener('blur',onBlur)}},[])
 const [freeFrame,setFreeFrame]=useState({x:7,y:28,width:24})
 const [placementRequest,setPlacementRequest]=useState<PlacementRequest|null>(null)
 const [placementError,setPlacementError]=useState('')
 const stageRef=useRef<HTMLDivElement>(null)
 const imageRef=useRef<HTMLImageElement>(null)
 const dragRef=useRef<{x:number;y:number;initial:{x:number;y:number;width:number};resize:boolean}|null>(null)
 const [finishes,setFinishes]=useState<FinishMap>(()=>makeFinishes(colors))
 const [paintTab,setPaintTab]=useState<'base'|'finish'|'texture'>('base')
 const [patterns,setPatterns]=useState<PatternMap>({})
 const pattern=patterns[selected]
 const updatePattern=(patch:Partial<RegionPattern>)=>setPatterns(old=>({...old,[selected]:{...(old[selected]??defaultPattern('checker')),...patch}}))
 const choosePattern=(id:PatternId)=>setPatterns(old=>({...old,[selected]:id==='none'?undefined:defaultPattern(id)}))
 const [preset,setPreset]=useState<Record<string,string>>({})
 const {undo,redo,canUndo,canRedo}=useDesignHistory(colors,finishes,artworks,surfaceStrokes,setFinishes,setArtworks,setSurfaceStrokes,onColorChange)
 const finish=finishes[selected]
 const patchFinish=(p:Partial<FinishState>)=>setFinishes(v=>({...v,[selected]:{...v[selected],...p}}))
 const selectPreset=(index:number)=>{
  const option=CHAMELEON_PRESETS[index]
  if(!option)return
  setPreset(v=>({...v,[selected]:option.name}))
  patchFinish({group:'chameleon',...(option.primary?{primary:option.primary,secondary:option.secondary}:{})})
  if(option.primary)onColorChange(selected,option.primary)
 }
 const resetRegion=()=>{
  setPatterns(v=>({...v,[selected]:undefined}))
  onColorChange(selected,'#ffffff')
  patchFinish({primary:'#ffffff',secondary:'#5b7cff',group:'classic'})
  setArtworks(v=>{const next={...v};delete next[selected];return next})
 }
 const resetAll=()=>{
  onReset()
  setFinishes(makeFinishes(Object.fromEntries(Object.keys(colors).map(id=>[id,'#ffffff'])) as AF1RegionColors))
  setArtworks({})
  setSurfaceStrokes([])
  setActiveSurface([])
  surfaceRef.current=[]
  paintingRef.current=false
  setPreset({})
  setPatterns({})
 }
 const art=artworks[selected]
 const freeArt=freeEdit?artworks[freeEdit]:undefined
 const onProject=useCallback((id:AF1RegionId,p:FreeProjection|null)=>{if(!p){setPlacementError('Move the center of your image over the shoe, then clip again.');return}setArtworks(v=>v[id]?{...v,[id]:{...v[id]!,freeProjection:p}}:v);setFreeEdit(null);setDrawMode(false);setPlacementError('')},[])
 const paintStroke=(ctx:CanvasRenderingContext2D,stroke:DrawStroke)=>{ctx.save();ctx.lineJoin='round';ctx.lineCap='round';ctx.lineWidth=stroke.size;ctx.globalCompositeOperation=stroke.tool==='eraser'?'destination-out':'source-over';ctx.strokeStyle=stroke.color;ctx.beginPath();stroke.points.forEach(([x,y],i)=>{if(i===0)ctx.moveTo(x*1024,y*1024);else ctx.lineTo(x*1024,y*1024)});if(stroke.points.length===1){const [x,y]=stroke.points[0];ctx.lineTo(x*1024+.01,y*1024+.01)}ctx.stroke();ctx.restore()}
 const rebuildArtwork=(id:AF1RegionId,strokes:DrawStroke[])=>{const current=artworks[id];if(!current)return;const image=new Image();image.onload=()=>{const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.max(1,Math.round(1024/current.aspect));const ctx=canvas.getContext('2d');if(!ctx)return;ctx.drawImage(image,0,0,canvas.width,canvas.height);ctx.save();ctx.scale(1,canvas.height/1024);strokes.forEach(st=>paintStroke(ctx,st));ctx.restore();const src=canvas.toDataURL('image/png');setArtworks(v=>v[id]?{...v,[id]:{...v[id]!,src,originalSrc:current.originalSrc??current.src,strokes}}:v)};image.src=current.originalSrc??current.src}
 const drawPoint=(e:import('react').PointerEvent<HTMLCanvasElement>)=>{if(!freeEdit||!drawMode||e.shiftKey)return;const rect=e.currentTarget.getBoundingClientRect();const x=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width)),y=Math.max(0,Math.min(1,(e.clientY-rect.top)/rect.height));if(!drawing.current){drawing.current={tool:brushTool,color:brushColor,size:brushSize,points:[[x,y]]};e.currentTarget.setPointerCapture(e.pointerId)}else drawing.current.points.push([x,y]);const canvas=e.currentTarget,ctx=canvas.getContext('2d');if(ctx){ctx.clearRect(0,0,canvas.width,canvas.height);paintStroke(ctx,drawing.current)}}
 const finishStroke=()=>{if(freeEdit&&drawing.current){rebuildArtwork(freeEdit,[...(artworks[freeEdit]?.strokes??[]),drawing.current]);drawing.current=null;drawCanvas.current?.getContext('2d')?.clearRect(0,0,1024,1024)}}
 const markFromEvent=(e:any):SurfaceMark|null=>{
   const hit=e.intersections?.find((item:any)=>regionForObject(item.object))
   if(!hit?.point||!(hit.object instanceof THREE.Mesh))return null
   const region=regionForObject(hit.object)
   if(!region)return null
   const normal=hit.face?.normal?.clone().transformDirection(hit.object.matrixWorld).normalize()??new THREE.Vector3(0,0,1)
   return {region,position:hit.point.toArray() as [number,number,number],normal:normal.toArray() as [number,number,number],color:brushColor,size:brushSize}
 }
 const stamp=(e:any)=>{
   if(!paintingRef.current||e.shiftKey)return
   const mark=markFromEvent(e);if(!mark)return
   const previous=surfaceRef.current[surfaceRef.current.length-1]
   if(brushTool==='eraser'){
     const radius=brushSize/150
     setSurfaceStrokes(strokes=>strokes.map(s=>({marks:s.marks.filter(m=>new THREE.Vector3(...m.position).distanceTo(new THREE.Vector3(...mark.position))>radius)})).filter(s=>s.marks.length))
     return
   }
   if(!previous){surfaceRef.current=[mark];setActiveSurface([...surfaceRef.current]);return}
   const start=new THREE.Vector3(...previous.position),finish=new THREE.Vector3(...mark.position)
   const distance=start.distanceTo(finish)
   const spacing=Math.max(.008,brushSize/400)
   if(distance<spacing*.4)return
   const count=Math.min(100,Math.ceil(distance/spacing))
   const added:SurfaceMark[]=[]
   for(let i=1;i<=count;i++){
     const t=i/count
     const p=start.clone().lerp(finish,t)
     const normal=new THREE.Vector3(...previous.normal).lerp(new THREE.Vector3(...mark.normal),t).normalize()
     added.push({...mark,position:p.toArray() as [number,number,number],normal:normal.toArray() as [number,number,number]})
   }
   surfaceRef.current=[...surfaceRef.current,...added]
   setActiveSurface([...surfaceRef.current])
 }
 const onSurfaceDown=(e:any)=>{if(!shoeDraw)return;paintingRef.current=true;surfaceRef.current=[];e.target?.setPointerCapture?.(e.pointerId);stamp(e)}
 const onSurfaceMove=(e:any)=>{if(shoeDraw&&paintingRef.current)stamp(e)}
 const onSurfaceUp=()=>{
   const completed=[...surfaceRef.current]
   if(completed.length)setSurfaceStrokes(v=>[...v,{marks:completed}])
   surfaceRef.current=[]
   setActiveSurface([])
   paintingRef.current=false
 }
 const clipArtwork=()=>{if(!freeEdit||!imageRef.current||!stageRef.current)return;const stage=stageRef.current.getBoundingClientRect(),image=imageRef.current.getBoundingClientRect();setPlacementRequest(v=>({id:freeEdit,frame:{x:(image.left-stage.left)/stage.width*100,y:(image.top-stage.top)/stage.height*100,width:image.width/stage.width*100,height:image.height/stage.height*100},serial:(v?.serial??0)+1}))}
 const startDrag=(e:import('react').PointerEvent<HTMLDivElement>,resize:boolean)=>{if(!e.shiftKey&&!resize)return;e.preventDefault();e.stopPropagation();e.currentTarget.setPointerCapture(e.pointerId);dragRef.current={x:e.clientX,y:e.clientY,initial:{...freeFrame},resize}}
 const moveDrag=(e:import('react').PointerEvent<HTMLDivElement>)=>{if(!dragRef.current||!stageRef.current)return;e.preventDefault();e.stopPropagation();const {x,y,initial,resize}=dragRef.current,rect=stageRef.current.getBoundingClientRect(),dx=(e.clientX-x)/rect.width*100,dy=(e.clientY-y)/rect.height*100;setFreeFrame(resize?{...initial,width:Math.max(5,Math.min(120,initial.width+dx))}:{...initial,x:initial.x+dx,y:initial.y+dy})}
 const stopDrag=()=>{dragRef.current=null}
 const patch=(p:Partial<Artwork3D>)=>setArtworks(v=>v[selected]?{...v,[selected]:{...v[selected]!,...p}}:v)
 const upload=(f:File)=>{if(!f.type.startsWith('image/'))return;const r=new FileReader();r.onload=()=>{const src=String(r.result);const img=new Image();img.onload=()=>{if(placementMode==='free'){setFreeFrame({x:7,y:28,width:24});setFreeEdit(selected);setPlacementError('')}setArtworks(v=>({...v,[selected]:{src,originalSrc:src,strokes:[],name:f.name,size:1,x:0,y:0,rotation:0,aspect:img.naturalWidth/Math.max(img.naturalHeight,1),mode:placementMode,regions:[selected],freeProjection:undefined}}))};img.src=src};r.readAsDataURL(f)}
 return <div className="af1-configurator">
  <div className="af1-parts"><h3>Shoe Parts</h3><p>Select an area to customize</p>{AF1_REGION_GROUPS.map(g=><section key={g.label}><span>{g.label}</span>{g.regions.map(id=><button key={id} className={selected===id?'active':''} onClick={()=>onSelect(id)}><i style={{background:colors[id]}}/>{AF1_REGION_LABELS[id]}</button>)}</section>)}</div>
  <div ref={stageRef} className="preview-3d af1-real-preview" style={{position:'relative'}}><div className="af1-history-buttons"><button disabled={!surfaceStrokes.length&&!activeSurface.length} onClick={()=>{surfaceRef.current=[];paintingRef.current=false;setActiveSurface([]);setSurfaceStrokes([])}} title="Reset freehand drawing">↺ Reset</button><button disabled={!canUndo} onClick={undo} title="Undo (Ctrl/Cmd+Z)">↶ Undo</button><button disabled={!canRedo} onClick={redo} title="Redo (Ctrl/Cmd+Shift+Z)">↷ Redo</button></div>
   <Canvas camera={{position:[3.8,2.3,4.8],fov:38}} shadows><color attach="background" args={['#17202d']}/><hemisphereLight args={['#ffffff','#52606f',0.85]}/><ambientLight intensity={0.38}/><directionalLight position={[5,6,6]} intensity={1.05}/><directionalLight position={[-5,4,4]} intensity={0.5}/><directionalLight position={[0,3,-6]} intensity={0.35}/><Suspense fallback={null}><RealAF1 colors={colors} onSelect={onSelect} artworks={artworks} finishes={finishes} patterns={patterns} placementRequest={placementRequest} onProject={onProject} shoeDraw={shoeDraw} onSurfaceDown={onSurfaceDown} onSurfaceMove={onSurfaceMove} onSurfaceUp={onSurfaceUp} surfaceStrokes={surfaceStrokes} activeSurface={activeSurface}/></Suspense>{!shoeDraw&&<StudioOrbitControls/>}</Canvas>
   {freeEdit&&freeArt?.mode==='free'&&<><div style={{position:'absolute',left:0,top:0,right:0,bottom:0,pointerEvents:'none',zIndex:5}}><div onPointerDown={e=>startDrag(e,false)} onPointerMove={moveDrag} onPointerUp={stopDrag} onPointerCancel={stopDrag} style={{position:'absolute',left:freeFrame.x+'%',top:freeFrame.y+'%',width:freeFrame.width+'%',cursor:drawMode&&!shiftHeld?'crosshair':'move',pointerEvents:shiftHeld||drawMode?'auto':'none',border:'2px dashed #37c6ff',touchAction:'none',userSelect:'none'}}><img ref={imageRef} src={freeArt.src} alt="Unclipped artwork" draggable={false} style={{display:'block',width:'100%',height:'auto',pointerEvents:'none'}}/>{drawMode&&<canvas ref={drawCanvas} width={1024} height={Math.round(1024/freeArt.aspect)} onPointerDown={drawPoint} onPointerMove={e=>{if(drawing.current)drawPoint(e)}} onPointerUp={finishStroke} onPointerCancel={finishStroke} style={{position:'absolute',inset:0,width:'100%',height:'100%',touchAction:'none',pointerEvents:shiftHeld?'none':'auto'}}/>}<div onPointerDown={e=>{e.stopPropagation();startDrag(e,true)}} style={{position:'absolute',right:-9,bottom:-9,width:18,height:18,background:'#37c6ff',border:'2px solid white',borderRadius:4,cursor:'nwse-resize',pointerEvents:'auto'}} title="Drag to resize"/></div></div><div style={{position:'absolute',left:12,bottom:42,zIndex:7,background:'#0e1726',padding:10,borderRadius:8,display:'flex',flexDirection:'column',gap:6,color:'white'}}><span>{drawMode?'Draw over artwork · Shift to move':'Hold Shift + drag image · drag corner to resize'}</span><button onClick={clipArtwork} style={{background:'#137dc4',color:'white',padding:8,borderRadius:6}}>Clip to Shoe</button>{placementError&&<small style={{color:'#ffb0b0'}}>{placementError}</small>}</div></>}
   <div className="af1-view-hint">Drag to rotate · scroll to zoom · Shift + drag to move</div></div>
  <div className="af1-region-control"><div className="af1-selected-title"><i style={{background:colors[selected]}}/><div><h2>{label}</h2><span>Customize · 16-region system</span></div></div><div className="af1-paint-tabs"><button className={paintTab==='base'?'active':''} onClick={()=>setPaintTab('base')}>Base Color</button><button className={paintTab==='finish'?'active':''} onClick={()=>setPaintTab('finish')}>Finish</button><button className={paintTab==='texture'?'active':''} onClick={()=>setPaintTab('texture')}>Texture</button></div>{paintTab==='texture'?<div className="af1-texture-panel"><h3>Pattern Textures</h3><p>Choose a texture for the selected shoe section, then customize its colors and pattern size.</p><button className="af1-reset-region" onClick={()=>choosePattern('none')}>No Texture / Remove</button><div className="af1-texture-grid">{PATTERNS.map(item=><PatternTile key={item.id} item={item} active={pattern?.id===item.id} onClick={()=>choosePattern(item.id)}/>)}</div>{pattern&&<div className="af1-texture-options"><h3>{PATTERNS.find(p=>p.id===pattern.id)?.label}</h3>{pattern.colors.map((color,i)=><label key={i}>Pattern Color {i+1}<input type="color" value={color} onChange={e=>updatePattern({colors:pattern.colors.map((v,j)=>i===j?e.target.value:v) as [string,string,string]})}/></label>)}<label>Scale {Math.round(pattern.scale*100)}%<input type="range" min="15" max="400" value={Math.round(pattern.scale*100)} onChange={e=>updatePattern({scale:+e.target.value/100})}/></label><label>Rotation {pattern.rotation}°<input type="range" min="0" max="360" value={pattern.rotation} onChange={e=>updatePattern({rotation:+e.target.value})}/></label><label>Horizontal Offset<input type="range" min="-100" max="100" value={pattern.offsetX*100} onChange={e=>updatePattern({offsetX:+e.target.value/100})}/></label><label>Vertical Offset<input type="range" min="-100" max="100" value={pattern.offsetY*100} onChange={e=>updatePattern({offsetY:+e.target.value/100})}/></label></div>}</div>:paintTab==='base'?<><div className="af1-current-color"><input aria-label={label+' color'} type="color" value={colors[selected]} onChange={e=>{onColorChange(selected,e.target.value);patchFinish({primary:e.target.value})}}/><input className="af1-hex-input" aria-label={label+' hex color'} value={colors[selected].toUpperCase()} maxLength={7} onChange={e=>{const v=e.target.value.startsWith('#')?e.target.value:'#'+e.target.value;if(validHex(v)){onColorChange(selected,v);patchFinish({primary:v})}}}/></div><div className="af1-palette">{palette.map(color=><button key={color} aria-label={'Set '+label+' to '+color} className={colors[selected].toLowerCase()===color?'active':''} style={{background:color}} onClick={()=>{onColorChange(selected,color);patchFinish({primary:color})}}/>)}</div></>:<div className="af1-finish-panel"><h3>Respray Colors</h3><label>Primary Color<div className="af1-current-color"><input type="color" value={finish.primary} onChange={e=>{patchFinish({primary:e.target.value});onColorChange(selected,e.target.value)}}/><input className="af1-hex-input" aria-label="Primary hex color" value={finish.primary.toUpperCase()} maxLength={7} onChange={e=>{const v=e.target.value.startsWith('#')?e.target.value:'#'+e.target.value;if(validHex(v)){patchFinish({primary:v});onColorChange(selected,v)}}}/></div></label><label>Secondary Color<div className="af1-current-color"><input type="color" value={finish.secondary} onChange={e=>patchFinish({secondary:e.target.value})}/><input className="af1-hex-input" aria-label="Secondary hex color" value={finish.secondary.toUpperCase()} maxLength={7} onChange={e=>{const v=e.target.value.startsWith('#')?e.target.value:'#'+e.target.value;if(validHex(v))patchFinish({secondary:v})}}/></div></label><h3>Color Groups</h3><div className="af1-finish-groups">{FINISH_GROUPS.map(g=><button key={g.id} className={finish.group===g.id?'active':''} onClick={()=>patchFinish({group:g.id})}>{g.label}<span>›</span></button>)}</div>{finish.group==='chameleon'&&<div className="af1-chameleon-presets"><label htmlFor="af1-chameleon-preset">Chameleon presets</label><select id="af1-chameleon-preset" value={preset[selected]||'Custom Chameleon'} onChange={e=>selectPreset(CHAMELEON_PRESETS.findIndex(p=>p.name===e.target.value))}>{CHAMELEON_PRESETS.map(p=><option key={p.name}>{p.name}</option>)}</select></div>}<p className="af1-finish-note">{finish.group==='chameleon'?'Primary and secondary colors drive the angle-shifting chameleon finish.':finish.group==='pearlescent'?'Primary color with a reflective pearl top-coat.':finish.group==='metallic'?'Primary color rendered with a reflective metallic finish.':finish.group==='matte'?'Primary color with a low-gloss matte surface.':'Select a finish group for this shoe region.'}</p></div>}
   <div className="af1-artwork-controls"><h3>Draw on Shoe</h3><p>Paint freely on the 3D sneaker without uploading any image. Rotate the shoe with drawing turned off.</p><button onClick={()=>{onSurfaceUp();setShoeDraw(v=>!v);setFreeEdit(null);setDrawMode(false)}}>{shoeDraw?'Finish Drawing':'Start Freehand Drawing'}</button>{shoeDraw&&<div style={{display:'grid',gap:8,margin:'10px 0'}}><label>Tool<select value={brushTool} onChange={e=>setBrushTool(e.target.value as 'brush'|'eraser')}><option value="brush">Brush</option><option value="eraser">Eraser</option></select></label><label>Color <input type="color" value={brushColor} onChange={e=>setBrushColor(e.target.value)}/></label><label>Brush Size {brushSize}<input type="range" min="2" max="80" value={brushSize} onChange={e=>setBrushSize(Number(e.target.value))}/></label></div>}<div style={{display:'flex',gap:5}}><button disabled={!surfaceStrokes.length} onClick={()=>setSurfaceStrokes(v=>v.slice(0,-1))}>Undo Drawing</button><button disabled={!surfaceStrokes.length} onClick={()=>setSurfaceStrokes([])}>Clear Drawing</button></div><h3>Artwork (Image / Logo)</h3><p>Place artwork on one section, selected sections, or freely across the shoe.</p><label>Artwork Placement<select value={art?.mode??placementMode} onChange={e=>{const mode=e.target.value as 'single'|'multiple'|'free';setPlacementMode(mode);if(art){patch({mode,regions:art.regions?.length?art.regions:[selected]});setFreeEdit(mode==='free'?selected:null);setPlacementError('')}}}><option value="single">Single Region</option><option value="multiple">Multiple Regions</option><option value="free">Free Placement (whole shoe)</option></select></label>{art?.mode==='multiple'&&<div className="af1-multi-region"><p>Allow artwork on these sections:</p>{AF1_REGION_GROUPS.flatMap(g=>g.regions).map(region=><label key={region} style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}><input type="checkbox" checked={(art.regions??[selected]).includes(region)} onChange={e=>patch({regions:e.target.checked?Array.from(new Set([...(art.regions??[selected]),region])):(art.regions??[selected]).filter(r=>r!==region)})}/>{AF1_REGION_LABELS[region]}</label>)}</div>}{art?.mode==='free'&&<div style={{display:'grid',gap:6,margin:'10px 0'}}><button onClick={()=>{setFreeEdit(selected);setDrawMode(v=>freeEdit===selected?!v:true)}}>{drawMode&&freeEdit===selected?'Close Touch Up':'Touch Up Artwork'}</button>{drawMode&&freeEdit===selected&&<><label>Tool<select value={brushTool} onChange={e=>setBrushTool(e.target.value as 'brush'|'eraser')}><option value="brush">Brush</option><option value="eraser">Eraser</option></select></label><label>Brush Color <input type="color" value={brushColor} onChange={e=>setBrushColor(e.target.value)}/></label><label>Brush Size {brushSize}<input type="range" min="2" max="80" value={brushSize} onChange={e=>setBrushSize(Number(e.target.value))}/></label><button onClick={()=>rebuildArtwork(selected,(art.strokes??[]).slice(0,-1))}>Undo Stroke</button><button onClick={()=>rebuildArtwork(selected,[])}>Clear Drawing</button></>}</div>}{art?.mode==='free'&&art.freeProjection&&freeEdit!==selected&&<button onClick={()=>{setFreeEdit(selected);setFreeFrame({x:7,y:28,width:24})}}>Edit Free Placement</button>}<input ref={fileRef} className="file-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const f=e.target.files?.[0];if(f)upload(f);e.target.value=''}}/><button className="af1-upload" onClick={()=>fileRef.current?.click()}><b>⇧</b><span>{art?'Replace Image':'Upload Image'}</span><small>PNG, JPG or WebP</small></button>{art&&<><small title={art.name}>{art.name}</small><label className="slider-label">Size <b>{Math.round(art.size*100)}%</b><input type="range" min="8" max="200" step="1" value={art.size*100} onChange={e=>patch({size:+e.target.value/100})}/></label><label className="slider-label">Horizontal <b>{art.x}</b><input type="range" min="-100" max="100" value={art.x} onChange={e=>patch({x:+e.target.value})}/></label><label className="slider-label">Vertical <b>{art.y}</b><input type="range" min="-100" max="100" value={art.y} onChange={e=>patch({y:+e.target.value})}/></label><label className="slider-label">Rotation <b>{art.rotation}°</b><input type="range" min="-180" max="180" value={art.rotation} onChange={e=>patch({rotation:+e.target.value})}/></label><button className="danger" onClick={()=>setArtworks(v=>{const n={...v};delete n[selected];return n})}>Remove artwork</button></>}</div>
   <button className="af1-reset-region" onClick={resetRegion}>Reset {label}</button><button className="af1-reset-all" onClick={resetAll}>Reset all colors</button></div>
 </div>
}
function PatternTile({item,active,onClick}:{item:{id:PatternId;label:string;category:string};active:boolean;onClick:()=>void}){
 const src=useMemo(()=>item.id==='bandana'?'/textures/bandana-paisley.png':item.id==='digitalCamo'?'/textures/digital-camo.png':item.id==='leopard'?'/textures/leopard.png':item.id==='ggSupreme'?'/textures/gg-monogram.jpg':item.id==='splatter'?'/textures/paint-splatter-colorful.png':item.id==='splatterBW'?'/textures/paint-splatter-bw.jpg':item.id==='splatterBlue'?'/textures/paint-splatter-blue.png':item.id==='fallCamoWoodland'?'/textures/fall-camo-woodland.png':item.id==='fallCamoLeaves'?'/textures/fall-camo-leaves.png':item.id==='tiger'?'/textures/tiger.png':item.id==='zebra'?'/textures/Zebra.png':makePatternCanvas(defaultPattern(item.id),96).toDataURL(),[item.id])
 return <button className={'af1-texture-tile'+(active?' active':'')} onClick={onClick} title={item.category+' · '+item.label}><img src={src} alt={item.label}/><span>{item.label}</span></button>
}
useGLTF.preload(MODEL_URL)
