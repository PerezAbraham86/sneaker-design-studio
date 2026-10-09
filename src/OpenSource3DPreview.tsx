import { Suspense, useEffect, useMemo, useState } from 'react'
import { Canvas, ThreeEvent } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { manifestForModel } from './modelManifest'
import type { PanelColors, PanelId } from './shoeTemplate'
import type { PreviewMaterial } from './ThreeDPreview'

type Props = { modelId: string; colors: PanelColors; selected: PanelId; material: PreviewMaterial; onSelect: (id: PanelId) => void }
const zones: [RegExp, PanelId][] = [
  [/toe.*box|vamp/i, 'toeBox'], [/toe|mudguard/i, 'toeGuard'], [/heel/i, 'heel'],
  [/collar|lining/i, 'collar'], [/tongue/i, 'tongue'], [/eye|laceguard/i, 'eyestay'],
  [/midsole|rim/i, 'midsole'], [/outsole|sole/i, 'outsole'], [/quarter|upper|main.*body/i, 'quarter']
]
function panelFor(name: string, modelId: string): PanelId | null {
  const exact = manifestForModel(modelId)?.parts.find(p => p.futureMeshName === name)
  return exact?.panelId ?? zones.find(([pattern]) => pattern.test(name))?.[1] ?? null
}
function Shoe({ url, ...props }: Props & { url: string }) {
  const { scene } = useGLTF(url)
  const instance = useMemo(() => {
    const root = scene.clone(true)
    root.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.material = Array.isArray(object.material) ? object.material.map(m => m.clone()) : object.material.clone()
      }
    })
    const bounds = new THREE.Box3().setFromObject(root)
    const size = bounds.getSize(new THREE.Vector3())
    const center = bounds.getCenter(new THREE.Vector3())
    root.position.sub(center)
    root.scale.setScalar(3.2 / Math.max(size.x, size.y, size.z, 0.001))
    return root
  }, [scene])
  useEffect(() => {
    instance.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return
      const id = panelFor(object.name || object.parent?.name || '', props.modelId)
      if (!id) return
      const materials: THREE.Material[] = Array.isArray(object.material) ? object.material : [object.material]
      for (const m of materials) {
        if (!(m instanceof THREE.MeshStandardMaterial)) continue
        m.color.set(props.colors[id])
        m.roughness = props.material === 'metallic' ? 0.25 : props.material === 'pearl' ? 0.36 : 0.72
        m.metalness = props.material === 'metallic' ? 0.8 : props.material === 'chameleon' ? 0.48 : 0.05
        m.emissive.set(id === props.selected ? '#292929' : '#000000')
        m.needsUpdate = true
      }
    })
  }, [instance, props.colors, props.selected, props.material, props.modelId])
  return <primitive object={instance} onClick={(event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    let obj: THREE.Object3D | null = event.object
    while (obj && obj !== instance) {
      const id = panelFor(obj.name, props.modelId)
      if (id) { props.onSelect(id); break }
      obj = obj.parent
    }
  }} />
}
export default function OpenSource3DPreview(props: Props) {
  const path = manifestForModel(props.modelId)?.asset.publicPath
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let active = true
    setReady(false)
    if (path) fetch(path, { method: 'HEAD' }).then(r => {
      if (active) setReady(r.ok && /model\/gltf-binary|application\/octet-stream/i.test(r.headers.get('content-type') || '') || r.ok && path.endsWith('.glb'))
    }).catch(() => { if (active) setReady(false) })
    return () => { active = false }
  }, [path])
  if (!path || !ready) return <div className="preview-3d-empty">A local licensed GLB is needed for the new Three.js renderer. The existing 3D preview remains available.</div>
  return <div className="preview-3d" style={{ height: 470, minHeight: 360 }}>
    <Canvas camera={{ position: [3, 2, 5], fov: 42 }} shadows>
      <color attach="background" args={['#f1f3f5']} />
      <ambientLight intensity={1.5} />
      <directionalLight position={[4, 7, 6]} intensity={2.2} />
      <Suspense fallback={null}><Shoe url={path} {...props} /></Suspense>
      <OrbitControls makeDefault enablePan={false} minDistance={2.5} maxDistance={10} />
    </Canvas>
    <p className="preview-3d-note">Three.js renderer · drag to rotate · scroll to zoom · select a mesh to recolor</p>
  </div>
}
