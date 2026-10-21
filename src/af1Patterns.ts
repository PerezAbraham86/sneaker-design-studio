import * as THREE from 'three'
import type {AF1RegionId} from './af1Regions'
export type PatternId='none'|'leopard'|'neonLeopard'|'rainbowLeopard'|'whiteLeopard'|'miniLeopard'|'tiger'|'zebra'|'cow'|'snakeskin'|'camo'|'desertCamo'|'urbanCamo'|'digitalCamo'|'checker'|'plaid'|'houndstooth'|'stripes'|'polka'|'bandana'|'ggSupreme'|'monogram'|'splatter'|'splatterBW'|'splatterBlue'|'graffiti'|'marble'|'flames'|'carbon'|'denim'|'leather'|'canvas'
export type RegionPattern={id:PatternId;colors:[string,string,string];scale:number;rotation:number;offsetX:number;offsetY:number}
export type PatternMap=Partial<Record<AF1RegionId,RegionPattern>>
export const PATTERNS:{id:PatternId;label:string;category:string}[]=[
{id:'leopard',label:'Leopard',category:'Animal'},{id:'neonLeopard',label:'Neon Leopard',category:'Animal'},{id:'rainbowLeopard',label:'Rainbow Leopard',category:'Animal'},{id:'whiteLeopard',label:'White Leopard',category:'Animal'},{id:'miniLeopard',label:'Mini Leopard',category:'Animal'},{id:'tiger',label:'Tiger',category:'Animal'},{id:'zebra',label:'Zebra',category:'Animal'},{id:'cow',label:'Cow Print',category:'Animal'},{id:'snakeskin',label:'Snakeskin',category:'Animal'},
{id:'camo',label:'Woodland Camo',category:'Camouflage'},{id:'desertCamo',label:'Desert Camo',category:'Camouflage'},{id:'urbanCamo',label:'Urban Camo',category:'Camouflage'},{id:'digitalCamo',label:'Digital Camo',category:'Camouflage'},
{id:'checker',label:'Checkerboard',category:'Geometric'},{id:'plaid',label:'Plaid',category:'Geometric'},{id:'houndstooth',label:'Houndstooth',category:'Geometric'},{id:'stripes',label:'Stripes',category:'Geometric'},{id:'polka',label:'Polka Dots',category:'Geometric'},
{id:'bandana',label:'Bandana Paisley',category:'Designer Inspired'},{id:'ggSupreme',label:'GG Supreme (inspired)',category:'Designer Inspired'},{id:'monogram',label:'Luxury Monogram',category:'Designer Inspired'},
{id:'splatter',label:'Colorful Splatter',category:'Artistic'},{id:'splatterBW',label:'Black & White Splatter',category:'Artistic'},{id:'splatterBlue',label:'Blue Splatter',category:'Artistic'},{id:'graffiti',label:'Graffiti',category:'Artistic'},{id:'marble',label:'Marble',category:'Artistic'},{id:'flames',label:'Flames',category:'Artistic'},
{id:'carbon',label:'Carbon Fiber',category:'Material'},{id:'denim',label:'Denim',category:'Material'},{id:'leather',label:'Leather Grain',category:'Material'},{id:'canvas',label:'Canvas',category:'Material'}
]
export const defaultPattern=(id:PatternId):RegionPattern=>({id,colors:id==='ggSupreme'?['#b7a080','#51412f','#85715b']:id==='bandana'?['#2850a4','#ffffff','#ffffff']:id==='digitalCamo'?['#f0e4ba','#267447','#262323']:id==='leopard'?['#c49b60','#1c2018','#79583c']:id==='camo'?['#6a7651','#273c31','#a8a17a']:id==='splatterBW'?['#ffffff','#000000','#888888']:id==='splatterBlue'?['#ffffff','#0066cc','#62c5fa']:id==='splatter'?['#ffffff','#2769dc','#ffcb19']:id==='neonLeopard'?['#0b0b0b','#39ff14','#f000ff']:id==='rainbowLeopard'?['#ffc37d','#f000ff','#00b5ff']:id==='whiteLeopard'?['#ffffff','#171717','#b9b9b9']:id==='urbanCamo'?['#aeb3ba','#303844','#6b7582']:id==='desertCamo'?['#dfc6a0','#7b553a','#b99467']:id==='tiger'?['#d88735','#1a100c','#fff0c7']:id==='zebra'?['#ffffff','#171717','#aaaaaa']:id==='cow'?['#ffffff','#171717','#a0a0a0']:id==='denim'?['#304e7d','#92a5c5','#5876a2']:id==='carbon'?['#171b20','#333a42','#101318']:['#f3e4ce','#211913','#ab7951'],scale:1,rotation:0,offsetX:0,offsetY:0})

/** Deterministic vector artwork. Canvas transforms are applied before drawing so
 * thumbnails and shoe maps use the exact same artwork and user colors. */
export function makePatternCanvas(p:RegionPattern,size=512):HTMLCanvasElement{
 const canvas=document.createElement('canvas');canvas.width=canvas.height=size
 const c=canvas.getContext('2d')!
 const [bg,ink,accent]=p.colors
 const rand=(x:number,y:number,k=0)=>{const n=Math.sin(x*127.1+y*311.7+k*71.9)*43758.5453;return n-Math.floor(n)}
 const blob=(x:number,y:number,rx:number,ry:number,seed:number,fill:string)=>{
  c.beginPath()
  for(let i=0;i<=24;i++){const t=i*Math.PI*2/24,r=.75+.35*rand(seed,i,3);const px=x+Math.cos(t)*rx*r,py=y+Math.sin(t)*ry*r;i?c.lineTo(px,py):c.moveTo(px,py)}
  c.closePath();c.fillStyle=fill;c.fill()
 }
 const path=(points:number[],fill:string)=>{c.beginPath();points.forEach((v,i)=>i%2===0?(i===0?c.moveTo(v,points[i+1]):c.lineTo(v,points[i+1])):null);c.closePath();c.fillStyle=fill;c.fill()}
 c.fillStyle=bg;c.fillRect(0,0,size,size)
 c.save();c.translate(size/2,size/2);c.rotate(p.rotation*Math.PI/180);c.translate(-size/2+p.offsetX*size/8,-size/2+p.offsetY*size/8)
 const unit=size/Math.max(3,8/Math.max(.15,Math.min(4,p.scale)))
 const id=p.id
 // Overscan rotated corners and shifted pattern coordinates.
 const from=-size*2,to=size*3
 if(['leopard','neonLeopard','rainbowLeopard','whiteLeopard','miniLeopard'].includes(id)){
  const step=unit*(id==='miniLeopard'?.55:1.15)
  for(let j=-16;j<24;j++)for(let i=-16;i<24;i++){
   const x=i*step+(j%2)*step*.48+step*.4,y=j*step*.84+step*.4
   if(x<from||x>to||y<from||y>to)continue
   const r=step*(.25+.09*rand(i,j)),phase=rand(i,j,2)*Math.PI*2
   c.strokeStyle=ink;c.lineWidth=step*.105;c.lineCap='round'
   c.fillStyle=accent;c.beginPath();c.ellipse(x,y,r*.84,r*.67,phase,0,Math.PI*2);c.fill()
   for(let k=0;k<3;k++){const a=phase+k*Math.PI*2/3+.2;c.beginPath();c.ellipse(x,y,r,r*.8,phase,a,a+.85);c.stroke()}
   if(rand(i,j,8)>.76)blob(x+step*.39,y-step*.31,step*.08,step*.12,i*13+j,ink)
  }
 }else if(id==='cow'){
  for(let j=-12;j<20;j++)for(let i=-12;i<20;i++){if(rand(i,j,1)>.76)continue;const x=(i+.3+rand(i,j,2)*.5)*unit*1.5,y=(j+.3+rand(i,j,3)*.6)*unit*1.4;blob(x,y,unit*(.28+rand(i,j,4)*.38),unit*(.25+rand(i,j,5)*.32),i*13+j,ink)}
 }else if(id==='tiger'||id==='zebra'){
  c.strokeStyle=ink;c.lineCap='round'
  for(let i=-45;i<65;i++){const x=i*unit*.36;c.beginPath();c.moveTo(x,-size*2)
   for(let j=0;j<=60;j++){const y=-size*2+j*size/12;const wav=Math.sin(y/unit*1.7+i*.75)*unit*.22+Math.sin(y/unit*.7+i)*unit*.14;c.lineTo(x+wav,y)}
   c.lineWidth=unit*(id==='tiger'?.12:.19)*(0.8+rand(i,2));c.stroke()}
 }else if(id==='snakeskin'){
  for(let j=-22;j<32;j++)for(let i=-22;i<32;i++){const x=(i+(j%2)*.5)*unit*.5,y=j*unit*.4;c.beginPath();c.ellipse(x,y,unit*.24,unit*.19,0,0,Math.PI*2);c.strokeStyle=ink;c.lineWidth=unit*.04;c.stroke();c.beginPath();c.ellipse(x,y,unit*.12,unit*.1,0,0,Math.PI*2);c.fillStyle=accent;c.fill()}
 }else if(['camo','desertCamo','urbanCamo','digitalCamo'].includes(id)){
  for(let j=-14;j<24;j++)for(let i=-14;i<24;i++){const x=i*unit*1.15+rand(i,j,1)*unit*.5,y=j*unit*.95+rand(i,j,2)*unit*.5;const fill=rand(i,j,3)>.5?ink:accent
   if(id==='digitalCamo'){c.fillStyle=fill;for(let k=0;k<7;k++)c.fillRect(x+Math.floor(rand(i,j,k)*5)*unit*.14,y+Math.floor(rand(j,i,k)*5)*unit*.14,unit*.19,unit*.19)}
   else blob(x,y,unit*(.4+rand(i,j,5)*.35),unit*(.2+rand(i,j,6)*.2),i*11+j,fill)
  }
 }else if(id==='checker'||id==='carbon'){
  for(let j=-20;j<30;j++)for(let i=-20;i<30;i++){const u=unit*.6,x=i*u,y=j*u;c.fillStyle=(i+j)%2===0?ink:accent;c.fillRect(x,y,u,u);if(id==='carbon'){c.fillStyle='rgba(255,255,255,.18)';c.fillRect(x+u*.1,y+u*.1,u*.7,u*.13)}}
 }else if(id==='plaid'){
  for(let x=from;x<to;x+=unit*2){c.fillStyle=ink;c.fillRect(x,from,unit*.55,to-from);c.fillStyle=accent;c.fillRect(x+unit*.18,from,unit*.12,to-from)}
  for(let y=from;y<to;y+=unit*2){c.fillStyle=ink;c.globalAlpha=.7;c.fillRect(from,y,to-from,unit*.55);c.globalAlpha=1;c.fillStyle=accent;c.fillRect(from,y+unit*.18,to-from,unit*.12)}
 }else if(id==='houndstooth'){
  for(let j=-22;j<30;j++)for(let i=-22;i<30;i++){if((i+j)%2!==0)continue;const x=i*unit*.8,y=j*unit*.8,u=unit*.8;path([x,y,x+u*.7,y,x+u*.7,y+u*.25,x+u,y+u*.25,x+u,y+u*.45,x+u*.65,y+u*.45,x+u*.45,y+u,x+u*.25,y+u,x+u*.25,y+u*.7,x,y+u*.7],ink)}
 }else if(id==='stripes'){
  for(let x=from;x<to;x+=unit){c.fillStyle=ink;c.fillRect(x,from,unit*.48,to-from)}
 }else if(id==='polka'){
  for(let j=-24;j<35;j++)for(let i=-24;i<35;i++){c.beginPath();c.arc(i*unit+(j%2)*unit*.5,j*unit,unit*.2,0,Math.PI*2);c.fillStyle=ink;c.fill()}
 }else if(id==='ggSupreme'||id==='monogram'){
  // Original interlocking-ring motif; not a copy of any trademarked logo.
  for(let j=-20;j<30;j++)for(let i=-20;i<30;i++){const x=i*unit*1.1+(j%2)*unit*.55,y=j*unit*.9;c.save();c.translate(x,y);c.strokeStyle=ink;c.lineWidth=unit*.075
   for(const dx of [-unit*.16,unit*.16]){c.beginPath();c.arc(dx,0,unit*.23,.35,Math.PI*1.8);c.stroke()}
   c.restore();if(id==='ggSupreme'){c.fillStyle=accent;c.beginPath();c.arc(x+unit*.48,y+unit*.35,unit*.045,0,Math.PI*2);c.fill()}}
 }else if(id==='bandana'){
  // Traditional bandana-inspired paisley: layered hooked teardrops,
  // scalloped floral rosettes, curling stems and small filler blossoms.
  // All ornaments use the user's selected background, ink and accent.
  const step=unit*2.45
  const paisley=(x:number,y:number,angle:number,scale:number)=>{
   c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale)
   const shape=()=>{
    c.beginPath();c.moveTo(0,-unit*.86)
    c.bezierCurveTo(unit*.76,-unit*.83,unit*.98,-unit*.1,unit*.65,unit*.47)
    c.bezierCurveTo(unit*.31,unit*.96,-unit*.45,unit*.85,-unit*.66,unit*.27)
    c.bezierCurveTo(-unit*.89,-unit*.27,-unit*.53,-unit*.76,0,-unit*.86)
    c.closePath()
   }
   shape();c.fillStyle=ink;c.fill()
   c.save();c.scale(.82,.82);shape();c.fillStyle=bg;c.fill();c.restore()
   // Inner scrolling teardrop, with a tapered curling hook.
   c.beginPath();c.moveTo(-unit*.18,-unit*.55)
   c.bezierCurveTo(unit*.62,-unit*.57,unit*.69,unit*.18,unit*.28,unit*.42)
   c.bezierCurveTo(-unit*.07,unit*.63,-unit*.43,unit*.28,-unit*.22,-unit*.08)
   c.bezierCurveTo(-unit*.04,-unit*.30,unit*.30,-unit*.22,unit*.23,unit*.02)
   c.strokeStyle=ink;c.lineWidth=unit*.085;c.lineCap='round';c.stroke()
   // Fine scalloped outline, small petals and center seed.
   for(let k=0;k<13;k++){const t=k*Math.PI*2/13
    c.beginPath();c.arc(Math.cos(t)*unit*.46,Math.sin(t)*unit*.48,unit*.055,0,Math.PI*2)
    c.fillStyle=accent;c.fill()
   }
   for(let k=0;k<7;k++){const t=k*Math.PI*2/7
    c.beginPath();c.ellipse(Math.cos(t)*unit*.22,Math.sin(t)*unit*.22,unit*.13,unit*.075,t,0,Math.PI*2);c.fillStyle=ink;c.fill()
   }
   c.beginPath();c.arc(0,0,unit*.095,0,Math.PI*2);c.fillStyle=accent;c.fill()
   c.restore()
  }
  const flower=(x:number,y:number,r:number)=>{
   for(let k=0;k<8;k++){const t=k*Math.PI/4;c.beginPath();c.ellipse(x+Math.cos(t)*r*.7,y+Math.sin(t)*r*.7,r*.42,r*.26,t,0,Math.PI*2);c.fillStyle=ink;c.fill()}
   c.beginPath();c.arc(x,y,r*.26,0,Math.PI*2);c.fillStyle=accent;c.fill()
   for(let k=0;k<8;k++){const t=k*Math.PI/4;c.beginPath();c.arc(x+Math.cos(t)*r*1.4,y+Math.sin(t)*r*1.4,r*.09,0,Math.PI*2);c.fillStyle=ink;c.fill()}
  }
  for(let j=-10;j<16;j++)for(let i=-10;i<16;i++){
   const x=i*step+(j%2)*step*.5,y=j*step
   paisley(x,y,-.48+(i+j)%3*.22,.75)
   flower(x+step*.54,y+step*.52,unit*.27)
   flower(x-step*.3,y+step*.57,unit*.14)
   // Delicate dotted border between large motifs.
   for(let k=0;k<6;k++){c.beginPath();c.arc(x+step*.17+k*step*.07,y+step*.82+Math.sin(k*.8)*unit*.06,unit*.035,0,Math.PI*2);c.fillStyle=ink;c.fill()}
  }
 }else if(id==='splatter'||id==='graffiti'){
  for(let i=0;i<420;i++){const x=rand(i,1)*size*3-size,y=rand(i,2)*size*3-size,r=unit*(.015+Math.pow(rand(i,3),5)*.24);c.fillStyle=i%3===0?ink:accent;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill()
   if(i%17===0){c.strokeStyle=c.fillStyle;c.lineWidth=r*.3;c.beginPath();c.moveTo(x-r*2,y-r*3);c.lineTo(x+r*3,y+r*2);c.stroke()}}
 }else if(id==='marble'){
  for(let i=-20;i<35;i++){c.beginPath();for(let j=0;j<=100;j++){const y=from+j*(to-from)/100,x=i*unit*.4+Math.sin(y/unit*.75+i)*unit*.27+Math.sin(y/unit*1.8+i*.4)*unit*.08;j?c.lineTo(x,y):c.moveTo(x,y)}c.strokeStyle=i%4===0?accent:ink;c.lineWidth=unit*(i%4===0?.12:.025);c.stroke()}
 }else if(id==='flames'){
  for(let i=-15;i<25;i++){const x=i*unit*.9,y=from;c.beginPath();c.moveTo(x-unit*.4,to);c.bezierCurveTo(x-unit*.5,size*.45,x+unit*.35,size*.6,x,size*.18);c.bezierCurveTo(x+unit*.7,size*.5,x+unit*.35,size*.65,x+unit*.5,to);c.closePath();c.fillStyle=i%2===0?ink:accent;c.fill()}
 }else if(id==='denim'||id==='canvas'){
  c.strokeStyle=ink;c.globalAlpha=.55;c.lineWidth=Math.max(1,unit*.035)
  for(let x=from;x<to;x+=unit*.12){c.beginPath();c.moveTo(x,from);c.lineTo(x,to);c.stroke()}
  c.strokeStyle=accent;for(let y=from;y<to;y+=unit*.12){c.beginPath();c.moveTo(from,y);c.lineTo(to,y);c.stroke()}c.globalAlpha=1
 }else if(id==='leather'){
  for(let j=-30;j<50;j++)for(let i=-30;i<50;i++){const x=i*unit*.32+rand(i,j)*unit*.14,y=j*unit*.32;c.beginPath();c.ellipse(x,y,unit*.08,unit*.04,rand(i,j,2)*6,0,Math.PI*2);c.fillStyle=rand(i,j,3)>.5?ink:accent;c.globalAlpha=.23;c.fill()}c.globalAlpha=1
 }
 c.restore();return canvas
}
/** Recolor the actual bandana PNG rather than synthesizing paisley shapes.
 * The source is blue/white: light pixels become ink, dark blue pixels become bg.
 * Draw on a full-coverage square canvas so the selected mesh gets a complete map.
 */
function bandanaCanvas(p:RegionPattern,image:HTMLImageElement,size=1024){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=size
 const c=canvas.getContext('2d')!
 const source=document.createElement('canvas');source.width=image.naturalWidth;source.height=image.naturalHeight
 const sc=source.getContext('2d')!;sc.drawImage(image,0,0)
 const pixels=sc.getImageData(0,0,source.width,source.height)
 const parse=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16))
 const bg=parse(p.colors[0]),ink=parse(p.colors[1])
 for(let i=0;i<pixels.data.length;i+=4){
  const r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2]
  const brightness=Math.max(0,Math.min(1,((r+g+b)/3-70)/175))
  const mix=Math.pow(brightness,1.25)
  for(let ch=0;ch<3;ch++)pixels.data[i+ch]=Math.round(bg[ch]*(1-mix)+ink[ch]*mix)
 }
 sc.putImageData(pixels,0,0)
 c.fillStyle=p.colors[0];c.fillRect(0,0,size,size)
 c.save();c.translate(size/2,size/2);c.rotate(p.rotation*Math.PI/180)
 const scale=Math.max(.15,Math.min(4,p.scale)),tile=size/scale
 const dx=p.offsetX*size/8,dy=p.offsetY*size/8
 // Overscan corners during rotation; fill the entire selected mesh UV space.
 for(let y=-size*2-tile+dy;y<size*2+tile;y+=tile)for(let x=-size*2-tile+dx;x<size*2+tile;x+=tile)c.drawImage(source,x,y,tile,tile)
 c.restore();return canvas
}
/** Map the source digital camouflage's natural tones into three editable colors.
 * Grouping by original RGB tone keeps the sharp, pixelated camouflage edges.
 */
function digitalCamoCanvas(p:RegionPattern,image:HTMLImageElement,size=1024){
 const source=document.createElement('canvas');source.width=image.naturalWidth;source.height=image.naturalHeight
 const sc=source.getContext('2d')!;sc.drawImage(image,0,0)
 const data=sc.getImageData(0,0,source.width,source.height)
 const palette=p.colors.map(hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)))
 for(let i=0;i<data.data.length;i+=4){
  const r=data.data[i],g=data.data[i+1],b=data.data[i+2]
  // Dark pixels use shadow, green-dominant pixels use foliage, and the rest use sand.
  const index=Math.max(r,g,b)<90?2:g>r*1.12&&g>b*1.08?1:0
  for(let ch=0;ch<3;ch++)data.data[i+ch]=palette[index][ch]
 }
 sc.putImageData(data,0,0)
 const canvas=document.createElement('canvas');canvas.width=canvas.height=size
 const c=canvas.getContext('2d')!;c.fillStyle=p.colors[0];c.fillRect(0,0,size,size)
 c.save();c.translate(size/2,size/2);c.rotate(p.rotation*Math.PI/180)
 const tile=size/Math.max(.15,Math.min(4,p.scale))
 const dx=p.offsetX*size/8,dy=p.offsetY*size/8
 for(let y=-size*2-tile+dy;y<size*2+tile;y+=tile)for(let x=-size*2-tile+dx;x<size*2+tile;x+=tile)c.drawImage(source,x,y,tile,tile)
 c.restore();return canvas
}
function leopardCanvas(p:RegionPattern,image:HTMLImageElement,size=1024){
 const source=document.createElement('canvas');source.width=source.height=size
 const sc=source.getContext('2d')!;sc.drawImage(image,0,0,size,size)
 const pixels=sc.getImageData(0,0,size,size)
 const colors=p.colors.map(hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)))
 for(let i=0;i<pixels.data.length;i+=4){
  const r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2]
  const light=.2126*r+.7152*g+.0722*b
  const middle=Math.max(0,Math.min(1,(light-45)/55))
  const bright=Math.max(0,Math.min(1,(light-105)/70))
  for(let j=0;j<3;j++){
   const shaded=colors[1][j]*(1-middle)+colors[2][j]*middle
   pixels.data[i+j]=Math.round(shaded*(1-bright)+colors[0][j]*bright)
  }
 }
 sc.putImageData(pixels,0,0)
 const canvas=document.createElement('canvas');canvas.width=canvas.height=size
 const c=canvas.getContext('2d')!;c.fillStyle=p.colors[0];c.fillRect(0,0,size,size)
 c.save();c.translate(size/2,size/2);c.rotate(p.rotation*Math.PI/180)
 const tile=size/Math.max(.15,Math.min(4,p.scale))
 const dx=p.offsetX*size/8,dy=p.offsetY*size/8
 for(let y=-size*2-tile+dy;y<size*2+tile;y+=tile)for(let x=-size*2-tile+dx;x<size*2+tile;x+=tile)c.drawImage(source,x,y,tile,tile)
 c.restore();return canvas
}
function ggImageCanvas(p:RegionPattern,image:HTMLImageElement,size=1024){
 const source=document.createElement('canvas');source.width=source.height=size
 const sc=source.getContext('2d')!
 // Use a square section at original aspect ratio, not the entire portrait wallpaper.
 const side=Math.min(image.naturalWidth,image.naturalHeight)
 const sx=(image.naturalWidth-side)/2,sy=(image.naturalHeight-side)/2
 sc.drawImage(image,sx,sy,side,side,0,0,size,size)
 const pixels=sc.getImageData(0,0,size,size)
 const colors=p.colors.map(hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)))
 for(let i=0;i<pixels.data.length;i+=4){
  const r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2]
  const brightness=(r+g+b)/3
  const ink=Math.max(0,Math.min(1,(brightness-60)/130))
  for(let j=0;j<3;j++)pixels.data[i+j]=Math.round(colors[1][j]*(1-ink)+colors[0][j]*ink)
 }
 sc.putImageData(pixels,0,0)
 const canvas=document.createElement('canvas');canvas.width=canvas.height=size
 const c=canvas.getContext('2d')!;c.fillStyle=p.colors[0];c.fillRect(0,0,size,size)
 c.save();c.translate(size/2,size/2);c.rotate(p.rotation*Math.PI/180)
 const tile=size/Math.max(.15,Math.min(4,p.scale))
 const dx=p.offsetX*size/8,dy=p.offsetY*size/8
 for(let y=-size*2-tile+dy;y<size*2+tile;y+=tile)for(let x=-size*2-tile+dx;x<size*2+tile;x+=tile)c.drawImage(source,x,y,tile,tile)
 c.restore();return canvas
}
function splatterImageCanvas(p:RegionPattern,image:HTMLImageElement,size=1024){
 const source=document.createElement('canvas');source.width=source.height=size
 const sc=source.getContext('2d')!
 const side=Math.min(image.naturalWidth,image.naturalHeight)
 sc.drawImage(image,(image.naturalWidth-side)/2,(image.naturalHeight-side)/2,side,side,0,0,size,size)
 // Keep the colorful artwork's original palette. For monochrome styles,
 // blend the ink against editable foreground/background colors.
 if(p.id!=='splatter'){
  const pixels=sc.getImageData(0,0,size,size)
  const bg=p.colors[0].match(/\w\w/g)!.map(v=>parseInt(v,16))
  const ink=p.colors[1].match(/\w\w/g)!.map(v=>parseInt(v,16))
  for(let i=0;i<pixels.data.length;i+=4){
   const r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2]
   const darkness=1-(r+g+b)/765
   const amount=Math.max(0,Math.min(1,darkness))
   for(let j=0;j<3;j++)pixels.data[i+j]=Math.round(bg[j]*(1-amount)+ink[j]*amount)
  }
  sc.putImageData(pixels,0,0)
 }
 const canvas=document.createElement('canvas');canvas.width=canvas.height=size
 const c=canvas.getContext('2d')!;c.fillStyle=p.colors[0];c.fillRect(0,0,size,size)
 c.save();c.translate(size/2,size/2);c.rotate(p.rotation*Math.PI/180)
 const tile=size/Math.max(.15,Math.min(4,p.scale))
 const dx=p.offsetX*size/8,dy=p.offsetY*size/8
 for(let y=-size*2-tile+dy;y<size*2+tile;y+=tile)for(let x=-size*2-tile+dx;x<size*2+tile;x+=tile)c.drawImage(source,x,y,tile,tile)
 c.restore();return canvas
}
export function makePatternTexture(p:RegionPattern,patternImage?:HTMLImageElement|null){const t=new THREE.CanvasTexture(p.id==='bandana'&&patternImage?bandanaCanvas(p,patternImage):p.id==='digitalCamo'&&patternImage?digitalCamoCanvas(p,patternImage):p.id==='leopard'&&patternImage?leopardCanvas(p,patternImage):p.id==='ggSupreme'&&patternImage?ggImageCanvas(p,patternImage):['splatter','splatterBW','splatterBlue'].includes(p.id)&&patternImage?splatterImageCanvas(p,patternImage):makePatternCanvas(p));t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.needsUpdate=true;return t}
