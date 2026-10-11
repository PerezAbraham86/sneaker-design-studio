import { Suspense, useEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { AF1_REGION_GROUPS, AF1_REGION_LABELS, type AF1RegionColors, type AF1RegionId } from './af1Regions'

const MODEL_URL = '/models/nike_air_force_1%20(1).glb'

function RealAF1({ colors, selected }: { colors: AF1RegionColors; selected: AF1RegionId }) {
  const { scene } = useGLTF(MODEL_URL)
  const model = useMemo(() => {
    const root = scene.clone(true)
    root.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.material = Array.isArray(object.material) ? object.material.map(material => material.clone()) : object.material.clone()
      }
    })
    const bounds = new THREE.Box3().setFromObject(root)
    const size = bounds.getSize(new THREE.Vector3())
    const center = bounds.getCenter(new THREE.Vector3())
    root.position.sub(center)
    root.scale.setScalar(3.5 / Math.max(size.x,size.y,size.z,0.001))
    return root
  }, [scene])

  useEffect(() => {
    // The source AF1 GLB currently exposes one paintable mesh/material. Until
    // geometry/UV masks are authored, only the whole base can be changed
    // truthfully. The 18-region state is retained now so each mask can be
    // connected without changing the configurator contract.
    model.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach(material => {
        if (material instanceof THREE.MeshStandardMaterial) {
          material.map = null
          material.color.set(colors[selected])
          material.needsUpdate = true
        }
      })
    })
  }, [model,colors,selected])

  useEffect(() => () => {
    model.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach(material => material.dispose())
    })
  }, [model])
  return <primitive object={model}/>
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
     <div className="af1-preview-toolbar"><strong>Actual Nike Air Force 1 · 3D</strong><span>Selected: {label}</span><button onClick={onReset}>Reset colors</button></div>
     <Canvas camera={{position:[3.8,2.3,4.8],fov:42}} shadows>
       <color attach="background" args={['#e8edf2']}/><ambientLight intensity={1.8}/><directionalLight position={[5,8,5]} intensity={2.5}/>
       <Suspense fallback={null}><RealAF1 colors={colors} selected={selected}/></Suspense><OrbitControls makeDefault enablePan={false} minDistance={2.1} maxDistance={9}/>
     </Canvas>
     <p className="preview-3d-note">Real AF1 · drag to rotate · scroll to zoom</p>
   </div>
   <div className="af1-region-control"><span className="micro">SELECTED REGION</span><h2>{label}</h2><label className="control-row">Color<input aria-label={label+' color'} type="color" value={colors[selected]} onChange={e=>onColorChange(selected,e.target.value)}/></label><code>{colors[selected].toUpperCase()}</code><p>The full 18-region control model is active. This source GLB is still one mesh/material, so the selected region color currently previews on the whole shoe until its geometry/UV mask is separated.</p><button onClick={()=>onColorChange(selected,'#ffffff')}>Reset {label}</button></div>
 </div>
}
