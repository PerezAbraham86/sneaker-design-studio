import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useLoader } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js'
import { AF1_REGION_GROUPS, AF1_REGION_LABELS, type AF1RegionColors, type AF1RegionId } from './af1Regions'

const MODEL_URL='/models/AF1-16regions(2).glb'
const normalizeName=(name:string)=>name.toLowerCase().replace(/[^a-z0-9]/g,'')
const REGION_BY_MESH:Record<string,AF1RegionId>={tip:'tip',vamp:'vamp',eyestay:'eyestay',quarterleft:'quarterLeft',quarterright:'quarterRight',swooshleft:'swooshLeft',swooshright:'swooshRight',tongue:'tongue',laces:'laces',liningleft:'liningLeft',liningright:'liningRight',backtab:'backtab',midsole:'midsole',midsolestripe:'midsoleStripe',midsolelogo:'midsoleLogo',outsole:'outsole'}

type Artwork3D={src:string;name:string;size:number;x:number;y:number;rotation:number;aspect:number}
type ArtworkMap=Partial<Record<AF1RegionId,Artwork3D>>
type FinishGroup='classic'|'matte'|'metallic'|'metals'|'pearlescent'|'chameleon'|'chrome'
type FinishState={primary:string;secondary:string;group:FinishGroup}
type FinishMap=Record<AF1RegionId,FinishState>
const FINISH_GROUPS:{id:FinishGroup;label:string}[]=[
 {id:'classic',label:'Classic'},{id:'matte',label:'Matte'},{id:'metallic',label:'Metallic'},
 {id:'metals',label:'Metals'},{id:'pearlescent',label:'Pearlescent'},{id:'chameleon',label:'Chameleon'},{id:'chrome',label:'Chrome'}
]
const makeFinishes=(colors:AF1RegionColors)=>Object.fromEntries(Object.entries(colors).map(([id,color])=>[id,{primary:color,secondary:'#5b7cff',group:'classic'}])) as FinishMap

function regionForObject(object:THREE.Object3D):AF1RegionId|undefined{let current:THREE.Object3D|null=object;while(current){const region=REGION_BY_MESH[normalizeName(current.name)];if(region)return region;current=current.parent}}

function RegionDecal({target,art}:{target:THREE.Mesh;art:Artwork3D}){
 const texture=useLoader(THREE.TextureLoader,art.src)
 useEffect(()=>{texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true},[texture])
 const geometry=useMemo(()=>{
   if(!target.geometry.boundingBox)target.geometry.computeBoundingBox()
   const box=target.geometry.boundingBox!.clone()
   const center=box.getCenter(new THREE.Vector3())
   const panel=box.getSize(new THREE.Vector3())
   center.x+=(art.x/100)*panel.x*.45
   center.y+=(art.y/100)*panel.y*.45

   // Size is one uniform scale. Height is derived from the uploaded image's
   // natural aspect ratio so artwork can never be stretched by the panel.
   const aspect=Math.max(art.aspect,.01)
   // Fit the complete image inside the usable panel footprint first, then
   // apply one uniform scale. This preserves aspect ratio without making a
   // portrait or landscape upload disappear because one panel axis is small.
   const maxWidth=Math.max(panel.x*.9,.08)
   const maxHeight=Math.max(panel.y*1.8,.08)
   const fitWidth=Math.min(maxWidth,maxHeight*aspect)
   const fitHeight=fitWidth/aspect
   const width=fitWidth*art.size
   const height=fitHeight*art.size
   const depth=Math.max(panel.z*3,.08)

   return new DecalGeometry(
     target,
     center,
     new THREE.Euler(0,0,THREE.MathUtils.degToRad(art.rotation)),
     new THREE.Vector3(width,height,depth)
   )
 },[target,art.x,art.y,art.size,art.rotation,art.aspect])
 useEffect(()=>()=>geometry.dispose(),[geometry])
 return <mesh geometry={geometry} renderOrder={10}><meshBasicMaterial map={texture} transparent alphaTest={.02} depthTest depthWrite={false} polygonOffset polygonOffsetFactor={-8} toneMapped={false} side={THREE.DoubleSide}/></mesh>
}
function RealAF1({colors,onSelect,artworks,finishes}:{colors:AF1RegionColors;onSelect:(id:AF1RegionId)=>void;artworks:ArtworkMap;finishes:FinishMap}){
 const {scene}=useGLTF(MODEL_URL)
 const model=useMemo(()=>{
  const root=scene.clone(true)
  root.traverse(object=>{if(object instanceof THREE.Mesh)object.material=Array.isArray(object.material)?object.material.map(m=>m.clone()):object.material.clone()})
  const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3())
  root.position.sub(center);root.scale.setScalar(3.5/Math.max(size.x,size.y,size.z,.001));root.updateMatrixWorld(true);return root
 },[scene])
 const regionMeshes=useMemo(()=>{const found={} as Partial<Record<AF1RegionId,THREE.Mesh>>;model.traverse(o=>{if(o instanceof THREE.Mesh){const r=regionForObject(o);if(r&&!found[r])found[r]=o}});return found},[model])
 useEffect(()=>{model.traverse(object=>{if(!(object instanceof THREE.Mesh))return;const region=regionForObject(object);if(!region)return;const finish=finishes[region];const ms=Array.isArray(object.material)?object.material:[object.material];ms.forEach(m=>{if(m instanceof THREE.MeshStandardMaterial){m.map=null;m.color.set(finish.primary||colors[region]);m.vertexColors=false;m.metalness=finish.group==='metallic'?0.65:finish.group==='metals'||finish.group==='chrome'?0.92:finish.group==='chameleon'?0.45:0.05;m.roughness=finish.group==='matte'?0.82:finish.group==='chrome'?0.08:finish.group==='metallic'||finish.group==='metals'?0.22:finish.group==='pearlescent'||finish.group==='chameleon'?0.18:0.42;m.clearcoat=finish.group==='pearlescent'||finish.group==='chameleon'||finish.group==='chrome'?1:0.15;m.clearcoatRoughness=finish.group==='chrome'?0.04:0.14;if(finish.group==='pearlescent'||finish.group==='chameleon'){m.iridescence=1;m.iridescenceIOR=1.65;m.iridescenceThicknessRange=finish.group==='chameleon'?[250,650] as [number,number]:[100,360] as [number,number]}else{m.iridescence=0}m.emissive.set(finish.group==='chameleon'?finish.secondary:'#000000');m.emissiveIntensity=finish.group==='chameleon'?0.035:0;m.needsUpdate=true}})})},[model,colors,finishes])
 useEffect(()=>()=>{model.traverse(o=>{if(o instanceof THREE.Mesh){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose())}})},[model])
 return <group><primitive object={model} onPointerDown={(e:any)=>{const hit=e.intersections?.[0]?.object as THREE.Object3D|undefined;if(!hit)return;const r=regionForObject(hit);if(r){e.stopPropagation();onSelect(r)}}}/>{Object.entries(artworks).map(([id,art])=>{const target=regionMeshes[id as AF1RegionId];return target&&art?<RegionDecal key={id} target={target} art={art}/>:null})}</group>
}

type Props={colors:AF1RegionColors;selected:AF1RegionId;onSelect:(id:AF1RegionId)=>void;onColorChange:(id:AF1RegionId,color:string)=>void;onReset:()=>void}

export default function AF1ColorPreview({colors,selected,onSelect,onColorChange,onReset}:Props){
 const label=AF1_REGION_LABELS[selected],fileRef=useRef<HTMLInputElement>(null)
 const palette=['#ffffff','#111111','#9ca3af','#d1d5db','#ff321c','#ff6b00','#ffb000','#ffd500','#39e600','#38c6d4','#2563eb','#7c22e8','#f52a87','#9a4c16','#c99d69','#f6dec3','#fffde5','#b8f5cb','#b9ddf5','#c9b6f4','#e5b7f3','#f2bfd7','#17172f','#11254a','#0d4176','#5c3c91','#ed4058','#2ac783','#ff9600','#ef4937']
 const [artworks,setArtworks]=useState<ArtworkMap>({})
 const [finishes,setFinishes]=useState<FinishMap>(()=>makeFinishes(colors))
 const [paintTab,setPaintTab]=useState<'base'|'finish'>('base')
 const finish=finishes[selected]
 const patchFinish=(p:Partial<FinishState>)=>setFinishes(v=>({...v,[selected]:{...v[selected],...p}}))
 const art=artworks[selected]
 const patch=(p:Partial<Artwork3D>)=>setArtworks(v=>v[selected]?{...v,[selected]:{...v[selected]!,...p}}:v)
 const upload=(f:File)=>{if(!f.type.startsWith('image/'))return;const r=new FileReader();r.onload=()=>{const src=String(r.result);const img=new Image();img.onload=()=>setArtworks(v=>({...v,[selected]:{src,name:f.name,size:.38,x:0,y:0,rotation:0,aspect:img.naturalWidth/Math.max(img.naturalHeight,1)}}));img.src=src};r.readAsDataURL(f)}
 return <div className="af1-configurator">
  <div className="af1-parts"><h3>Shoe Parts</h3><p>Select an area to customize</p>{AF1_REGION_GROUPS.map(g=><section key={g.label}><span>{g.label}</span>{g.regions.map(id=><button key={id} className={selected===id?'active':''} onClick={()=>onSelect(id)}><i style={{background:colors[id]}}/>{AF1_REGION_LABELS[id]}</button>)}</section>)}</div>
  <div className="preview-3d af1-real-preview">
   <Canvas camera={{position:[3.8,2.3,4.8],fov:38}} shadows><color attach="background" args={['#17202d']}/><hemisphereLight args={['#ffffff','#cbd3dc',2.4]}/><ambientLight intensity={1.15}/><directionalLight position={[5,6,6]} intensity={2.1}/><directionalLight position={[-5,4,4]} intensity={1.65}/><directionalLight position={[0,3,-6]} intensity={1.35}/><directionalLight position={[0,7,0]} intensity={1}/><Suspense fallback={null}><RealAF1 colors={colors} onSelect={onSelect} artworks={artworks} finishes={finishes}/></Suspense><OrbitControls makeDefault enablePan={false} minDistance={2.1} maxDistance={9}/></Canvas>
   <div className="af1-view-hint">Drag to rotate · scroll to zoom</div></div>
  <div className="af1-region-control"><div className="af1-selected-title"><i style={{background:colors[selected]}}/><div><h2>{label}</h2><span>Customize · 16-region system</span></div></div><div className="af1-paint-tabs"><button className={paintTab==='base'?'active':''} onClick={()=>setPaintTab('base')}>Base Color</button><button className={paintTab==='finish'?'active':''} onClick={()=>setPaintTab('finish')}>Finish</button></div>{paintTab==='base'?<><div className="af1-current-color"><input aria-label={label+' color'} type="color" value={colors[selected]} onChange={e=>{onColorChange(selected,e.target.value);patchFinish({primary:e.target.value})}}/><code>{colors[selected].toUpperCase()}</code></div><div className="af1-palette">{palette.map(color=><button key={color} aria-label={'Set '+label+' to '+color} className={colors[selected].toLowerCase()===color?'active':''} style={{background:color}} onClick={()=>{onColorChange(selected,color);patchFinish({primary:color})}}/>)}</div></>:<div className="af1-finish-panel"><h3>Respray Colors</h3><label>Primary Color<div className="af1-current-color"><input type="color" value={finish.primary} onChange={e=>{patchFinish({primary:e.target.value});onColorChange(selected,e.target.value)}}/><code>{finish.primary.toUpperCase()}</code></div></label><label>Secondary Color<div className="af1-current-color"><input type="color" value={finish.secondary} onChange={e=>patchFinish({secondary:e.target.value})}/><code>{finish.secondary.toUpperCase()}</code></div></label><h3>Color Groups</h3><div className="af1-finish-groups">{FINISH_GROUPS.map(g=><button key={g.id} className={finish.group===g.id?'active':''} onClick={()=>patchFinish({group:g.id})}>{g.label}<span>›</span></button>)}</div><p className="af1-finish-note">{finish.group==='chameleon'?'Primary and secondary colors drive the angle-shifting chameleon finish.':finish.group==='pearlescent'?'Primary color with a reflective pearl top-coat.':finish.group==='metallic'?'Primary color rendered with a reflective metallic finish.':finish.group==='matte'?'Primary color with a low-gloss matte surface.':'Select a finish group for this shoe region.'}</p></div>}
   <div className="af1-artwork-controls"><h3>Artwork (Image / Logo)</h3><p>Upload a PNG, JPG or WebP. The image will map to this region.</p><input ref={fileRef} className="file-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const f=e.target.files?.[0];if(f)upload(f);e.target.value=''}}/><button className="af1-upload" onClick={()=>fileRef.current?.click()}><b>⇧</b><span>{art?'Replace Image':'Upload Image'}</span><small>PNG, JPG or WebP</small></button>{art&&<><small title={art.name}>{art.name}</small><label className="slider-label">Size <b>{Math.round(art.size*100)}%</b><input type="range" min="8" max="100" value={art.size*100} onChange={e=>patch({size:+e.target.value/100})}/></label><label className="slider-label">Horizontal <b>{art.x}</b><input type="range" min="-100" max="100" value={art.x} onChange={e=>patch({x:+e.target.value})}/></label><label className="slider-label">Vertical <b>{art.y}</b><input type="range" min="-100" max="100" value={art.y} onChange={e=>patch({y:+e.target.value})}/></label><label className="slider-label">Rotation <b>{art.rotation}°</b><input type="range" min="-180" max="180" value={art.rotation} onChange={e=>patch({rotation:+e.target.value})}/></label><button className="danger" onClick={()=>setArtworks(v=>{const n={...v};delete n[selected];return n})}>Remove artwork</button></>}</div>
   <button className="af1-reset-region" onClick={()=>onColorChange(selected,'#ffffff')}>Reset {label}</button><button className="af1-reset-all" onClick={onReset}>Reset all colors</button></div>
 </div>
}
useGLTF.preload(MODEL_URL)
