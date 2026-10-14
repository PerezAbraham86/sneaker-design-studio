import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useLoader } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js'
import { AF1_REGION_GROUPS, AF1_REGION_LABELS, type AF1RegionColors, type AF1RegionId } from './af1Regions'

const MODEL_URL='/models/AF1-16regions(2).glb'
const normalizeName=(name:string)=>name.toLowerCase().replace(/[^a-z0-9]/g,'')
const REGION_BY_MESH:Record<string,AF1RegionId>={tip:'tip',vamp:'vamp',eyestay:'eyestay',quarterleft:'quarterLeft',quarterright:'quarterRight',swooshleft:'swooshLeft',swooshright:'swooshRight',tongue:'tongue',laces:'laces',liningleft:'liningLeft',liningright:'liningRight',backtab:'backtab',midsole:'midsole',midsolestripe:'midsoleStripe',midsolelogo:'midsoleLogo',outsole:'outsole'}

type Artwork3D={src:string;name:string;size:number;x:number;y:number;rotation:number}
type ArtworkMap=Partial<Record<AF1RegionId,Artwork3D>>

function regionForObject(object:THREE.Object3D):AF1RegionId|undefined{let current:THREE.Object3D|null=object;while(current){const region=REGION_BY_MESH[normalizeName(current.name)];if(region)return region;current=current.parent}}

function RegionDecal({target,art}:{target:THREE.Mesh;art:Artwork3D}){
 // DecalGeometry expects projector coordinates in the target mesh's LOCAL
 // coordinate system. Using Box3.setFromObject() here produced world-space
 // coordinates, so the generated decal geometry missed the mesh entirely.
 const texture=useLoader(THREE.TextureLoader,art.src)
 useEffect(()=>{texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true},[texture])
 const geometry=useMemo(()=>{
   if(!target.geometry.boundingBox)target.geometry.computeBoundingBox()
   const box=target.geometry.boundingBox!.clone()
   const center=box.getCenter(new THREE.Vector3())
   const size=box.getSize(new THREE.Vector3())
   center.x+=(art.x/100)*size.x*.45
   center.y+=(art.y/100)*size.y*.45
   // Project through the panel along local Z; the separated AF1 regions retain
   // the source shoe coordinate system, so this works on either visible side.
   const depth=Math.max(size.z*3,.08)
   const width=Math.max(size.x*.9,.08)*art.size
   const height=Math.max(size.y*1.8,.08)*art.size
   return new DecalGeometry(target,center,new THREE.Euler(0,0,THREE.MathUtils.degToRad(art.rotation)),new THREE.Vector3(width,height,depth))
 },[target,art.x,art.y,art.size,art.rotation])
 useEffect(()=>()=>geometry.dispose(),[geometry])
 return <mesh geometry={geometry} renderOrder={10}><meshBasicMaterial map={texture} transparent alphaTest={.02} depthTest depthWrite={false} polygonOffset polygonOffsetFactor={-8} toneMapped={false} side={THREE.DoubleSide}/></mesh>
}

function RealAF1({colors,onSelect,artworks}:{colors:AF1RegionColors;onSelect:(id:AF1RegionId)=>void;artworks:ArtworkMap}){
 const {scene}=useGLTF(MODEL_URL)
 const model=useMemo(()=>{
  const root=scene.clone(true)
  root.traverse(object=>{if(object instanceof THREE.Mesh)object.material=Array.isArray(object.material)?object.material.map(m=>m.clone()):object.material.clone()})
  const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3())
  root.position.sub(center);root.scale.setScalar(3.5/Math.max(size.x,size.y,size.z,.001));root.updateMatrixWorld(true);return root
 },[scene])
 const regionMeshes=useMemo(()=>{const found={} as Partial<Record<AF1RegionId,THREE.Mesh>>;model.traverse(o=>{if(o instanceof THREE.Mesh){const r=regionForObject(o);if(r&&!found[r])found[r]=o}});return found},[model])
 useEffect(()=>{model.traverse(object=>{if(!(object instanceof THREE.Mesh))return;const region=regionForObject(object);if(!region)return;const ms=Array.isArray(object.material)?object.material:[object.material];ms.forEach(m=>{if(m instanceof THREE.MeshStandardMaterial){m.map=null;m.color.set(colors[region]);m.vertexColors=false;m.needsUpdate=true}})})},[model,colors])
 useEffect(()=>()=>{model.traverse(o=>{if(o instanceof THREE.Mesh){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose())}})},[model])
 return <group><primitive object={model} onPointerDown={(e:any)=>{const hit=e.intersections?.[0]?.object as THREE.Object3D|undefined;if(!hit)return;const r=regionForObject(hit);if(r){e.stopPropagation();onSelect(r)}}}/>{Object.entries(artworks).map(([id,art])=>{const target=regionMeshes[id as AF1RegionId];return target&&art?<RegionDecal key={id} target={target} art={art}/>:null})}</group>
}

type Props={colors:AF1RegionColors;selected:AF1RegionId;onSelect:(id:AF1RegionId)=>void;onColorChange:(id:AF1RegionId,color:string)=>void;onReset:()=>void}

export default function AF1ColorPreview({colors,selected,onSelect,onColorChange,onReset}:Props){
 const label=AF1_REGION_LABELS[selected],fileRef=useRef<HTMLInputElement>(null)
 const [artworks,setArtworks]=useState<ArtworkMap>({})
 const art=artworks[selected]
 const patch=(p:Partial<Artwork3D>)=>setArtworks(v=>v[selected]?{...v,[selected]:{...v[selected]!,...p}}:v)
 const upload=(f:File)=>{if(!f.type.startsWith('image/'))return;const r=new FileReader();r.onload=()=>setArtworks(v=>({...v,[selected]:{src:String(r.result),name:f.name,size:.38,x:0,y:0,rotation:0}}));r.readAsDataURL(f)}
 return <div className="af1-configurator">
  <div className="af1-parts"><h3>Shoe Parts</h3><p>Select an area to customize</p>{AF1_REGION_GROUPS.map(g=><section key={g.label}><span>{g.label}</span>{g.regions.map(id=><button key={id} className={selected===id?'active':''} onClick={()=>onSelect(id)}><i style={{background:colors[id]}}/>{AF1_REGION_LABELS[id]}</button>)}</section>)}</div>
  <div className="preview-3d af1-real-preview"><div className="af1-preview-toolbar"><strong>Nike Air Force 1 · 16-region 3D</strong><span>Selected: {label}</span><button onClick={onReset}>Reset colors</button></div>
   <Canvas camera={{position:[3.8,2.3,4.8],fov:42}} shadows><color attach="background" args={['#e8edf2']}/><hemisphereLight args={['#ffffff','#cbd3dc',2.4]}/><ambientLight intensity={1.15}/><directionalLight position={[5,6,6]} intensity={2.1}/><directionalLight position={[-5,4,4]} intensity={1.65}/><directionalLight position={[0,3,-6]} intensity={1.35}/><directionalLight position={[0,7,0]} intensity={1}/><Suspense fallback={null}><RealAF1 colors={colors} onSelect={onSelect} artworks={artworks}/></Suspense><OrbitControls makeDefault enablePan={false} minDistance={2.1} maxDistance={9}/></Canvas>
   <p className="preview-3d-note">16 color regions · upload artwork to selected region · drag to rotate · scroll to zoom</p></div>
  <div className="af1-region-control"><span className="micro">SELECTED REGION</span><h2>{label}</h2><label className="control-row">Color<input aria-label={label+' color'} type="color" value={colors[selected]} onChange={e=>onColorChange(selected,e.target.value)}/></label><code>{colors[selected].toUpperCase()}</code>
   <div className="af1-artwork-controls"><h3>Artwork</h3><input ref={fileRef} className="file-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const f=e.target.files?.[0];if(f)upload(f);e.target.value=''}}/><button className="primary" onClick={()=>fileRef.current?.click()}>{art?'Replace image':'+ Upload image'}</button>{art&&<><small title={art.name}>{art.name}</small><label className="slider-label">Size <b>{Math.round(art.size*100)}%</b><input type="range" min="8" max="100" value={art.size*100} onChange={e=>patch({size:+e.target.value/100})}/></label><label className="slider-label">Horizontal <b>{art.x}</b><input type="range" min="-100" max="100" value={art.x} onChange={e=>patch({x:+e.target.value})}/></label><label className="slider-label">Vertical <b>{art.y}</b><input type="range" min="-100" max="100" value={art.y} onChange={e=>patch({y:+e.target.value})}/></label><label className="slider-label">Rotation <b>{art.rotation}°</b><input type="range" min="-180" max="180" value={art.rotation} onChange={e=>patch({rotation:+e.target.value})}/></label><button className="danger" onClick={()=>setArtworks(v=>{const n={...v};delete n[selected];return n})}>Remove artwork</button></>}</div>
   <button onClick={()=>onColorChange(selected,'#ffffff')}>Reset {label}</button></div>
 </div>
}
useGLTF.preload(MODEL_URL)
