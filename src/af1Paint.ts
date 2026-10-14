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

// Preserve the GLB's original PBR settings but upgrade its materials so
// clearcoat and iridescence can actually render (GLTF usually uses Standard).
export function makePaintMaterial(source:THREE.Material):THREE.Material{
 if(source instanceof THREE.MeshStandardMaterial){
  const physical=new THREE.MeshPhysicalMaterial({
   color:source.color.clone(),map:source.map,normalMap:source.normalMap,
   roughnessMap:source.roughnessMap,metalnessMap:source.metalnessMap,
   aoMap:source.aoMap,emissive:source.emissive.clone(),
   roughness:source.roughness,metalness:source.metalness,
   side:source.side,transparent:source.transparent,opacity:source.opacity,
   alphaTest:source.alphaTest
  })
  physical.normalScale.copy(source.normalScale)
  return physical
 }
 return source.clone()
}

type PaintShader=THREE.WebGLProgramParametersWithUniforms
const shaderByMaterial=new WeakMap<THREE.MeshStandardMaterial,PaintShader>()

export function applyPaint(material:THREE.Material,finish:PaintFinish){
 if(!(material instanceof THREE.MeshStandardMaterial))return
 const physical=material instanceof THREE.MeshPhysicalMaterial?material:null
 material.map=null
 material.vertexColors=false
 material.color.set(finish.primary)
 material.emissive.set('#000000')
 material.emissiveIntensity=0
 material.metalness=finish.group==='chrome'?.85:finish.group==='metals'?.7:finish.group==='metallic'?.38:.04
 material.roughness=finish.group==='matte'?.86:finish.group==='chrome'?.13:finish.group==='metals'?.25:finish.group==='metallic'?.34:.44
 if(physical){
  physical.clearcoat=finish.group==='matte'?0:finish.group==='classic'?.12:1
  physical.clearcoatRoughness=finish.group==='chrome'?.09:.2
  physical.iridescence=finish.group==='chameleon'?.75:finish.group==='pearlescent'?.38:0
  physical.iridescenceIOR=1.45
  physical.iridescenceThicknessRange=[140,430]
 }
 const shifting=finish.group==='chameleon'||finish.group==='pearlescent'
 const primary=new THREE.Color(finish.primary)
 const secondary=new THREE.Color(finish.secondary)
 const strength=finish.group==='chameleon'?.98:finish.group==='pearlescent'?.72:0
 const live=shaderByMaterial.get(material)
 if(live){
  live.uniforms.uPaintPrimary.value.copy(primary)
  live.uniforms.uPaintSecondary.value.copy(secondary)
  live.uniforms.uPaintStrength.value=strength
 }
 material.onBeforeCompile=shader=>{
  shader.uniforms.uPaintPrimary={value:primary}
  shader.uniforms.uPaintSecondary={value:secondary}
  shader.uniforms.uPaintStrength={value:strength}
  shaderByMaterial.set(material,shader)
  shader.fragmentShader='uniform vec3 uPaintPrimary;\nuniform vec3 uPaintSecondary;\nuniform float uPaintStrength;\n'+shader.fragmentShader
  shader.fragmentShader=shader.fragmentShader.replace(
   '#include <color_fragment>',
   `#include <color_fragment>
   vec3 paintN=normalize(normal);
   vec3 paintV=normalize(vViewPosition);
   float paintFacing=abs(dot(paintN,paintV));
   float paintEdge=pow(1.0-clamp(paintFacing,0.0,1.0),0.72);
   diffuseColor.rgb=mix(uPaintPrimary,uPaintSecondary,clamp(paintEdge*uPaintStrength,0.0,1.0));`
  )
 }
 material.customProgramCacheKey=()=> 'sneaker-live-angle-paint-v3'
 if(!shifting){
  // strength=0 leaves the exact primary color while retaining one stable
  // shader program, so switching finish groups never leaves stale uniforms.
 }
 material.needsUpdate=!live
}

