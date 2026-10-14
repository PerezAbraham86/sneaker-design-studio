import * as THREE from 'three'

export type PaintGroup='classic'|'matte'|'metallic'|'metals'|'pearlescent'|'chameleon'|'chrome'
export type PaintFinish={primary:string;secondary:string;group:PaintGroup}

export const CHAMELEON_PRESETS=[
 {name:'Green / Blue Flip',primary:'#13B96D',secondary:'#1758D9'},
 {name:'Purple / Green Flip',primary:'#8521B5',secondary:'#21B36B'},
 {name:'Purple / Blue Flip',primary:'#8629C8',secondary:'#145AFF'},
 {name:'Red / Gold Flip',primary:'#C12636',secondary:'#E9B533'},
 {name:'Blue / Pink Flip',primary:'#124AD7',secondary:'#F144B4'},
 {name:'Gold / Green Flip',primary:'#E3AE29',secondary:'#128D59'},
 {name:'Custom Chameleon',primary:null,secondary:null}
] as const

// Clone only. Never replace the GLB's material class: doing so changed the
// AF1 render in PR #42/#43.
export function makePaintMaterial(source:THREE.Material):THREE.Material{
 return source.clone()
}

type LiveShader={uniforms:Record<string,{value:any}>}
const liveShaders=new WeakMap<THREE.MeshStandardMaterial,LiveShader>()

export function applyPaint(material:THREE.Material,finish:PaintFinish){
 if(!(material instanceof THREE.MeshStandardMaterial))return
 material.map=null
 material.vertexColors=false
 material.color.set(finish.primary)
 material.emissive.set('#000000')
 material.emissiveIntensity=0
 material.metalness=finish.group==='chrome'?.82:finish.group==='metals'?.7:finish.group==='metallic'?.48:.02
 material.roughness=finish.group==='matte'?.86:finish.group==='chrome'?.12:finish.group==='metals'?.25:finish.group==='metallic'?.3:.48

 const primary=new THREE.Color(finish.primary)
 const secondary=new THREE.Color(finish.secondary)
 const mode=finish.group==='chameleon'?2:finish.group==='pearlescent'?1:0
 const strength=mode===2?.96:mode===1?.58:0
 const live=liveShaders.get(material)
 if(live){
  live.uniforms.uSneakerPrimary.value.copy(primary)
  live.uniforms.uSneakerSecondary.value.copy(secondary)
  live.uniforms.uSneakerStrength.value=strength
  live.uniforms.uSneakerMode.value=mode
 }

 // Patch only the final outgoing fragment color. This leaves the original
 // MeshStandardMaterial geometry, normals, maps and lighting pipeline intact.
 material.onBeforeCompile=shader=>{
  shader.uniforms.uSneakerPrimary={value:primary}
  shader.uniforms.uSneakerSecondary={value:secondary}
  shader.uniforms.uSneakerStrength={value:strength}
  shader.uniforms.uSneakerMode={value:mode}
  liveShaders.set(material,shader)
  shader.fragmentShader=shader.fragmentShader.replace(
   '#include <common>',
   `#include <common>
uniform vec3 uSneakerPrimary;
uniform vec3 uSneakerSecondary;
uniform float uSneakerStrength;
uniform float uSneakerMode;`
  )
  shader.fragmentShader=shader.fragmentShader.replace(
   '#include <opaque_fragment>',
   `if(uSneakerMode > 0.5){
  vec3 N = normalize(normal);
  vec3 V = normalize(vViewPosition);
  float fresnel = pow(1.0 - clamp(abs(dot(N,V)),0.0,1.0), 1.35);
  float shift = clamp(fresnel * uSneakerStrength,0.0,1.0);
  vec3 finishColor = mix(uSneakerPrimary,uSneakerSecondary,shift);
  float lightness = max(max(outgoingLight.r,outgoingLight.g),outgoingLight.b);
  vec3 litFinish = finishColor * mix(0.72,1.28,clamp(lightness,0.0,1.0));
  outgoingLight = mix(outgoingLight,litFinish,uSneakerMode > 1.5 ? 0.82 : 0.48);
}
#include <opaque_fragment>`
  )
 }
 material.customProgramCacheKey=()=> 'af1-safe-finish-overlay-v1'
 material.needsUpdate=!live
}
