import * as THREE from 'three'
import type {AF1RegionId} from './af1Regions'
export type PatternId='none'|'leopard'|'neonLeopard'|'rainbowLeopard'|'whiteLeopard'|'miniLeopard'|'tiger'|'zebra'|'cow'|'snakeskin'|'camo'|'desertCamo'|'urbanCamo'|'digitalCamo'|'checker'|'plaid'|'houndstooth'|'stripes'|'polka'|'bandana'|'ggSupreme'|'monogram'|'splatter'|'graffiti'|'marble'|'flames'|'carbon'|'denim'|'leather'|'canvas'
export type RegionPattern={id:PatternId;colors:[string,string,string];scale:number;rotation:number;offsetX:number;offsetY:number}
export type PatternMap=Partial<Record<AF1RegionId,RegionPattern>>
export const PATTERNS:{id:PatternId;label:string;category:string}[]=[
{id:'leopard',label:'Leopard',category:'Animal'},{id:'neonLeopard',label:'Neon Leopard',category:'Animal'},{id:'rainbowLeopard',label:'Rainbow Leopard',category:'Animal'},{id:'whiteLeopard',label:'White Leopard',category:'Animal'},{id:'miniLeopard',label:'Mini Leopard',category:'Animal'},{id:'tiger',label:'Tiger',category:'Animal'},{id:'zebra',label:'Zebra',category:'Animal'},{id:'cow',label:'Cow Print',category:'Animal'},{id:'snakeskin',label:'Snakeskin',category:'Animal'},
{id:'camo',label:'Woodland Camo',category:'Camouflage'},{id:'desertCamo',label:'Desert Camo',category:'Camouflage'},{id:'urbanCamo',label:'Urban Camo',category:'Camouflage'},{id:'digitalCamo',label:'Digital Camo',category:'Camouflage'},
{id:'checker',label:'Checkerboard',category:'Geometric'},{id:'plaid',label:'Plaid',category:'Geometric'},{id:'houndstooth',label:'Houndstooth',category:'Geometric'},{id:'stripes',label:'Stripes',category:'Geometric'},{id:'polka',label:'Polka Dots',category:'Geometric'},
{id:'bandana',label:'Bandana Paisley',category:'Designer Inspired'},{id:'ggSupreme',label:'GG Supreme (inspired)',category:'Designer Inspired'},{id:'monogram',label:'Luxury Monogram',category:'Designer Inspired'},
{id:'splatter',label:'Paint Splatter',category:'Artistic'},{id:'graffiti',label:'Graffiti',category:'Artistic'},{id:'marble',label:'Marble',category:'Artistic'},{id:'flames',label:'Flames',category:'Artistic'},
{id:'carbon',label:'Carbon Fiber',category:'Material'},{id:'denim',label:'Denim',category:'Material'},{id:'leather',label:'Leather Grain',category:'Material'},{id:'canvas',label:'Canvas',category:'Material'}
]
export const defaultPattern=(id:PatternId):RegionPattern=>({id,colors:id==='ggSupreme'?['#b7a080','#51412f','#85715b']:id==='bandana'?['#2174aa','#ffffff','#103b5e']:id==='camo'?['#6a7651','#273c31','#a8a17a']:id==='splatter'?['#f12e45','#2769dc','#ffcb19']:['#f3e4ce','#211913','#ab7951'],scale:1,rotation:0,offsetX:0,offsetY:0})
const int=(n:number)=>Math.floor(n)
const noise=(x:number,y:number,seed=0)=>{const v=Math.sin(int(x)*127.1+int(y)*311.7+seed*78.23)*43758.5453;return v-Math.floor(v)}
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t
const smooth=(x:number)=>x*x*(3-2*x)
const valueNoise=(x:number,y:number,seed=0)=>{const ix=int(x),iy=int(y),fx=smooth(x-ix),fy=smooth(y-iy);return lerp(lerp(noise(ix,iy,seed),noise(ix+1,iy,seed),fx),lerp(noise(ix,iy+1,seed),noise(ix+1,iy+1,seed),fx),fy)}
const rgba=(hex:string)=>{const v=hex.replace('#','');return [0,2,4].map(i=>parseInt(v.slice(i,i+2),16)||0)}
const color=(c:number[])=>'rgb('+c.map(v=>Math.max(0,Math.min(255,Math.round(v)))).join(',')+')'
export function makePatternCanvas(p:RegionPattern,size=256):HTMLCanvasElement{
 const canvas=document.createElement('canvas');canvas.width=canvas.height=size
 const ctx=canvas.getContext('2d')!; const img=ctx.createImageData(size,size)
 const cs=p.colors.map(rgba),s=Math.max(.15,Math.min(6,p.scale)),a=p.rotation*Math.PI/180,ca=Math.cos(a),sa=Math.sin(a)
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=(x/size-.5)*8/s+p.offsetX,v=(y/size-.5)*8/s+p.offsetY
  const X=u*ca-v*sa,Y=u*sa+v*ca,ix=int(X),iy=int(Y),fx=X-ix,fy=Y-iy
  const n=valueNoise(X*1.7,Y*1.7,1),m=valueNoise(X*3,Y*3,3)
  let k=0;const id=p.id
  if(['leopard','neonLeopard','rainbowLeopard','whiteLeopard','miniLeopard'].includes(id)){
    const z=id==='miniLeopard'?2:1,px=X*z,py=Y*z,cx=int(px),cy=int(py),dx=px-cx-.5,dy=py-cy-.5,dist=Math.sqrt(dx*dx+dy*dy)*2.2,ang=Math.atan2(dy,dx)
    k=dist<.70&&dist>.34&&Math.sin(ang*3+noise(cx,cy,2)*7)>-.45?1:dist<.30?2:0
    if(id==='rainbowLeopard'&&k===0)k=noise(cx,cy,5)>.6?2:0
  }else if(id==='tiger'||id==='zebra'){k=Math.sin(X*8+Math.sin(Y*3)*1.8+n*3)>0?1:0}
  else if(id==='cow'){k=valueNoise(X*1.4,Y*1.4,8)>.57?1:0}
  else if(id==='snakeskin'){const dx=fx-.5,dy=fy-.5;k=(Math.abs(dx)+Math.abs(dy))<.49?1:2;if(Math.abs(dx)+Math.abs(dy)<.33)k=0}
  else if(id.toLowerCase().includes('camo')){const q=id==='digitalCamo'?noise(int(X*5),int(Y*5),4):n;k=q>.63?1:q>.38?2:0}
  else if(id==='checker'){k=(ix+iy+10000)%2}
  else if(id==='plaid'){k=fx<.18||fy<.18?1:fx<.28||fy<.28?2:0}
  else if(id==='houndstooth'){k=((ix+iy+10000)%2===0?fx+fy>0.5:fx+fy<.5)?1:0}
  else if(id==='stripes'){k=fx<.5?1:0}
  else if(id==='polka'){k=Math.hypot(fx-.5,fy-.5)<.28?1:0}
  else if(id==='ggSupreme'||id==='monogram'){const dx=fx-.5,dy=fy-.5,r=Math.hypot(dx,dy);k=(r>.21&&r<.32&&!(dx>.08&&dy<-.05))||(Math.abs(dx)<.07&&Math.abs(dy)<.25)?1:0;if(id==='ggSupreme'&&Math.abs((X+Y)%1)<.035)k=2}
  else if(id==='bandana'){const r=Math.hypot(fx-.5,fy-.5);k=r<.29&&r>.20?1:r<.10||Math.abs(fx-fy)<.045?2:0}
  else if(id==='splatter'||id==='graffiti'){const q=noise(int(X*12),int(Y*12),3);k=q>.91?1:q>.82?2:0}
  else if(id==='marble'){k=Math.sin(X*2+Y*3+n*5)>0.7?1:Math.sin(X*2+Y*3+n*5)>.5?2:0}
  else if(id==='flames'){k=fy<(.22+Math.sin(X*5+n*2)*.25)?1:fy<.6?2:0}
  else if(id==='carbon'){k=(ix+iy+10000)%2?1:2}
  else if(id==='denim'||id==='canvas'||id==='leather'){k=id==='leather'?(n>.7?1:0):fx<.08||fy<.08?1:0}
  const c=cs[k],idx=(y*size+x)*4;img.data[idx]=c[0];img.data[idx+1]=c[1];img.data[idx+2]=c[2];img.data[idx+3]=255
 }
 ctx.putImageData(img,0,0);return canvas
}
export function makePatternTexture(p:RegionPattern){const t=new THREE.CanvasTexture(makePatternCanvas(p));t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.needsUpdate=true;return t}
