import {useEffect,useState} from 'react'
import {OrbitControls} from '@react-three/drei'
import * as THREE from 'three'

export default function StudioOrbitControls(){
 const [shiftHeld,setShiftHeld]=useState(false)
 useEffect(()=>{
  const down=(e:KeyboardEvent)=>{if(e.key==='Shift')setShiftHeld(true)}
  const up=(e:KeyboardEvent)=>{if(e.key==='Shift')setShiftHeld(false)}
  const blur=()=>setShiftHeld(false)
  window.addEventListener('keydown',down)
  window.addEventListener('keyup',up)
  window.addEventListener('blur',blur)
  return()=>{
   window.removeEventListener('keydown',down)
   window.removeEventListener('keyup',up)
   window.removeEventListener('blur',blur)
  }
 },[])
 return <OrbitControls makeDefault enablePan minDistance={2.1} maxDistance={9}
  mouseButtons={{LEFT:shiftHeld?THREE.MOUSE.PAN:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN}}/>
}
