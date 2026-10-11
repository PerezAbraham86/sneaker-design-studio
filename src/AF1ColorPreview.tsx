import { Suspense, useEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const MODEL_URL = '/models/nike_air_force_1%20(1).glb'

function RealAF1({ color }: { color: string }) {
  const { scene } = useGLTF(MODEL_URL)
  const model = useMemo(() => {
    const root = scene.clone(true)
    root.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.material = Array.isArray(object.material)
          ? object.material.map(material => material.clone())
          : object.material.clone()
      }
    })
    const bounds = new THREE.Box3().setFromObject(root)
    const size = bounds.getSize(new THREE.Vector3())
    const center = bounds.getCenter(new THREE.Vector3())
    root.position.sub(center)
    root.scale.setScalar(3.5 / Math.max(size.x, size.y, size.z, 0.001))
    return root
  }, [scene])

  useEffect(() => {
    model.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach(material => {
        if (material instanceof THREE.MeshStandardMaterial) {
          // Preserve original textures and use the color as a tint.
          material.color.set(color)
          material.needsUpdate = true
        }
      })
    })
  }, [model, color])

  useEffect(() => () => {
    model.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach(material => material.dispose())
    })
  }, [model])

  return <primitive object={model} />
}

export default function AF1ColorPreview({ color, onColorChange }: { color: string; onColorChange: (color: string) => void }) {
  return <div className="preview-3d af1-real-preview">
    <div className="af1-preview-toolbar">
      <strong>Actual Nike Air Force 1 · 3D</strong>
      <label>Whole shoe tint <input aria-label="Actual AF1 color" type="color" value={color} onChange={event => onColorChange(event.target.value)} /></label>
      <button onClick={() => onColorChange('#ffffff')}>Reset</button>
    </div>
    <Canvas camera={{ position: [3.8, 2.3, 4.8], fov: 42 }} shadows>
      <color attach="background" args={['#e8edf2']} />
      <ambientLight intensity={1.8} />
      <directionalLight position={[5, 8, 5]} intensity={2.5} />
      <Suspense fallback={null}><RealAF1 color={color} /></Suspense>
      <OrbitControls makeDefault enablePan={false} minDistance={2.1} maxDistance={9} />
    </Canvas>
    <p className="preview-3d-note">Real AF1 model · drag to rotate · scroll to zoom · color picker changes the full textured mesh</p>
  </div>
}
