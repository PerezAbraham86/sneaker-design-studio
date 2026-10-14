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
  const physical=new THREE.MeshPhysicalMaterial()
  physical.copy(source)
  return physical
 }
 return source.clone()
}

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
  physical.iridescence=finish.group==='chameleon'?.6:finish.group==='pearlescent'?.28:0
  physical.iridescenceIOR=1.45
  physical.iridescenceThicknessRange=[140,430]
 }
 // Fresnel color shift: surface-facing pixels retain the primary color;
 // grazing-angle pixels reveal the secondary paint/pearl. Unlike a static
 // color blend, the pattern moves as the shoe or camera rotates.
 const shifting=finish.group==='chameleon'||finish.group==='pearlescent'
 if(shifting){
  const primary=new THREE.Color(finish.primary)
  const secondary=new THREE.Color(finish.secondary)
  const strength=finish.group==='chameleon'?.98:.64
  material.onBeforeCompile=shader=>{
   shader.uniforms.uPaintPrimary={value:primary}
   shader.uniforms.uPaintSecondary={value:secondary}
   shader.uniforms.uPaintStrength={value:strength}
   shader.fragmentShader='uniform vec3 uPaintPrimary;\nuniform vec3 uPaintSecondary;\nuniform float uPaintStrength;\n'+shader.fragmentShader
   shader.fragmentShader=shader.fragmentShader.replace(
    '#include <color_fragment>',
    `#include <color_fragment>
    float paintFacing=abs(dot(normalize(vNormal),normalize(vViewPosition)));
    float paintEdge=pow(1.0-clamp(paintFacing,0.0,1.0),1.15);
    diffuseColor.rgb=mix(uPaintPrimary,uPaintSecondary,clamp(paintEdge*uPaintStrength,0.0,1.0));`
   )
  }
  material.customProgramCacheKey=()=> 'sneaker-angle-paint-v2'
 }else{
  material.onBeforeCompile=()=>{}
  material.customProgramCacheKey=()=> 'sneaker-standard-paint-v2'
 }
 material.needsUpdate=true
}
