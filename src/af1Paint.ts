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

// Preserve the GLB material class and shading. Advanced finish work must not
// replace the imported shoe material, because that changes the model render.
export function makePaintMaterial(source:THREE.Material):THREE.Material{
 return source.clone()
}

export function applyPaint(material:THREE.Material,finish:PaintFinish){
 if(!(material instanceof THREE.MeshStandardMaterial))return
 material.map=null
 material.vertexColors=false
 material.color.set(finish.primary)
 material.emissive.set('#000000')
 material.emissiveIntensity=0
 material.metalness=finish.group==='chrome'?.82:finish.group==='metals'?.7:finish.group==='metallic'?.48:.02
 material.roughness=finish.group==='matte'?.86:finish.group==='chrome'?.12:finish.group==='metals'?.25:finish.group==='metallic'?.3:.48
 material.onBeforeCompile=()=>{}
 material.customProgramCacheKey=()=> 'af1-restored-standard-v1'
 material.needsUpdate=true
}
