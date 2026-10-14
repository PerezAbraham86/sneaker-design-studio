import { Suspense, useEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { AF1_REGION_GROUPS, AF1_REGION_LABELS, type AF1RegionColors, type AF1RegionId } from './af1Regions'

const MODEL_URL = '/models/AF1-16regions(2).glb'

const normalizeName = (name:string) => name.toLowerCase().replace(/[^a-z0-9]/g,'')
const REGION_BY_MESH: Record<string,AF1RegionId> = {
  tip:'tip',
  vamp:'vamp',
  eyestay:'eyestay',
  quarterleft:'quarterLeft',
  quarterright:'quarterRight',
  swooshleft:'swooshLeft',
  swooshright:'swooshRight',
  tongue:'tongue',
  laces:'laces',
  liningleft:'liningLeft',
  liningright:'liningRight',
  backtab:'backtab',
  midsole:'midsole',
  midsolestripe:'midsoleStripe',
  midsolelogo:'midsoleLogo',
  outsole:'outsole',
}

function regionForObject(object:THREE.Object3D):AF1RegionId|undefined {
  let current:THREE.Object3D|null=object
  while(current){
    const region=REGION_BY_MESH[normalizeName(current.name)]
    if(region) return region
    current=current.parent
  }
}

function RealAF1({ colors, onSelect }: { colors: AF1RegionColors; onSelect:(id:AF1RegionId)=>void }) {
  const { scene } = useGLTF(MODEL_URL)
  const model = useMemo(() => {
    const root = scene.clone(true)
    root.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return
      object.material = Array.isArray(object.material)
        ? object.material.map(material => material.clone())
        : object.material.clone()
    })
    const bounds = new THREE.Box3().setFromObject(root)
    const size = bounds.getSize(new THREE.Vector3())
    const center = bounds.getCenter(new THREE.Vector3())
    root.position.sub(center)
    root.scale.setScalar(3.5 / Math.max(size.x,size.y,size.z,0.001))
    return root
  }, [scene])

  useEffect(() => {
    model.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return
      const region=regionForObject(object)
      if(!region) return
      const materials=Array.isArray(object.material)?object.material:[object.material]
      materials.forEach(material=>{
        if(!(material instanceof THREE.MeshStandardMaterial)) return
        // The Blender export is authored with a neutral base. Keep its
        // roughness/normal detail maps while the UI supplies each panel color.
        material.map=null
        material.color.set(colors[region])
        material.vertexColors=false
        material.needsUpdate=true
      })
    })
  },[model,colors])

  const pickRegion=(event:any)=>{
    const hit=event.intersections?.[0]?.object as THREE.Object3D|undefined
    if(!hit) return
    const region=regionForObject(hit)
    if(!region) return
    event.stopPropagation()
    onSelect(region)
  }

  useEffect(()=>()=> {
    model.traverse(object=>{
      if(!(object instanceof THREE.Mesh)) return
      const materials=Array.isArray(object.material)?object.material:[object.material]
      materials.forEach(material=>material.dispose())
    })
  },[model])

  return <primitive object={model} onPointerDown={pickRegion}/>
}

type Props={colors:AF1RegionColors;selected:AF1RegionId;onSelect:(id:AF1RegionId)=>void;onColorChange:(id:AF1RegionId,color:string)=>void;onReset:()=>void}

export default function AF1ColorPreview({colors,selected,onSelect,onColorChange,onReset}:Props){
 const label=AF1_REGION_LABELS[selected]
 return <div className="af1-configurator">
   <div className="af1-parts">
     <h3>Shoe Parts</h3><p>Select an area to customize</p>
     {AF1_REGION_GROUPS.map(group=><section key={group.label}><span>{group.label}</span>{group.regions.map(id=><button key={id} className={selected===id?'active':''} onClick={()=>onSelect(id)}><i style={{background:colors[id]}}/>{AF1_REGION_LABELS[id]}</button>)}</section>)}
   </div>
   <div className="preview-3d af1-real-preview">
     <div className="af1-preview-toolbar"><strong>Nike Air Force 1 · 16-region 3D</strong><span>Selected: {label}</span><button onClick={onReset}>Reset colors</button></div>
     <Canvas camera={{position:[3.8,2.3,4.8],fov:42}} shadows>
       <color attach="background" args={['#e8edf2']}/>
       <hemisphereLight args={['#ffffff','#cbd3dc',2.4]}/>
       <ambientLight intensity={1.15}/>
       <directionalLight position={[5,6,6]} intensity={2.1}/>
       <directionalLight position={[-5,4,4]} intensity={1.65}/>
       <directionalLight position={[0,3,-6]} intensity={1.35}/>
       <directionalLight position={[0,7,0]} intensity={1.0}/>
       <Suspense fallback={null}><RealAF1 colors={colors} onSelect={onSelect}/></Suspense><OrbitControls makeDefault enablePan={false} minDistance={2.1} maxDistance={9}/>
     </Canvas>
     <p className="preview-3d-note">16 independently colorable regions · click a shoe part to select · drag to rotate · scroll to zoom</p>
   </div>
   <div className="af1-region-control"><span className="micro">SELECTED REGION</span><h2>{label}</h2><label className="control-row">Color<input aria-label={label+' color'} type="color" value={colors[selected]} onChange={e=>onColorChange(selected,e.target.value)}/></label><code>{colors[selected].toUpperCase()}</code><p>The current Blender-authored AF1 has 16 mapped regions. Backtab Logo and Seams remain intentionally omitted until those objects are authored separately.</p><button onClick={()=>onColorChange(selected,'#ffffff')}>Reset {label}</button></div>
 </div>
}

useGLTF.preload(MODEL_URL)
