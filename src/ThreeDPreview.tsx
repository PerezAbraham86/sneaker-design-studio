import {useEffect,useRef,useState} from 'react'
import {manifestForModel} from './modelManifest'
import type {PanelColors,PanelId} from './shoeTemplate'

type Props={modelId:string;colors:PanelColors;selected:PanelId;onSelect:(panel:PanelId)=>void}
type Part={id:PanelId;vertices:number[];normals:number[];indices:number[]}
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v))
function makeSurface(id:PanelId,fn:(u:number,v:number)=>[number,number,number],nu=18,nv=12):Part{
 const vertices:number[]=[],normals:number[]=[],indices:number[]=[]
 for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++){const u=i/nu,v=j/nv,p=fn(u,v),a=fn(clamp(u+.001,0,1),v),b=fn(u,clamp(v+.001,0,1));vertices.push(...p);const ax=a[0]-p[0],ay=a[1]-p[1],az=a[2]-p[2],bx=b[0]-p[0],by=b[1]-p[1],bz=b[2]-p[2];let x=ay*bz-az*by,y=az*bx-ax*bz,z=ax*by-ay*bx;const l=Math.hypot(x,y,z)||1;normals.push(x/l,y/l,z/l)}
 for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const a=i*(nv+1)+j,b=a+nv+1;indices.push(a,b,a+1,b,b+1,a+1)}
 return{id,vertices,normals,indices}
}
function shape():Part[]{
 const width=(x:number)=>.49*Math.sqrt(Math.max(.05,1-Math.pow((x-.12)/1.75,4)))
 const sole=(id:PanelId,y:number,thickness:number)=>makeSurface(id,(u,v)=>{const x=-1.56+u*3.27,angle=v*Math.PI*2;return[x,y+thickness*Math.sin(angle),width(x)*1.18*Math.cos(angle)]},38,20)
 const upper=(id:PanelId,x0:number,x1:number,v0:number,v1:number,side=1)=>makeSurface(id,(u,v)=>{const x=x0+(x1-x0)*u,t=v0+(v1-v0)*v,theta=(side>0?1:-1)*(.08+t*1.48);return[x,.35+Math.sin(t*Math.PI*.73)*(.54-.1*x)+.025*Math.cos(u*12),width(x)*Math.cos(theta)]},24,14)
 return [
 sole('outsole',.10,.13),sole('midsole',.24,.14),
 upper('heel',-1.48,-.78,.03,.96),upper('quarter',-.85,.65,.04,.85),
 upper('toeGuard',.56,1.58,.02,.38),upper('toeBox',.57,1.52,.38,.98),
 upper('eyestay',-.65,.45,.76,1),upper('tongue',-.55,.4,.9,1.16),
 upper('collar',-1.25,-.55,.82,1.08),
 upper('heel',-1.48,-.78,.03,.96,-1),upper('quarter',-.85,.65,.04,.85,-1),
 upper('toeGuard',.56,1.58,.02,.38,-1),upper('toeBox',.57,1.52,.38,.98,-1),
 upper('eyestay',-.65,.45,.76,1,-1)
 ]
}
const VS='attribute vec3 position;attribute vec3 normal;uniform mat4 transform;uniform mat4 world;varying vec3 n;varying vec3 p;void main(){vec4 pos=world*vec4(position,1.);p=pos.xyz;n=mat3(world)*normal;gl_Position=transform*pos;}'
const FS='precision mediump float;uniform vec3 color;uniform vec3 light;uniform float selected;varying vec3 n;varying vec3 p;void main(){float diffuse=.32+.68*abs(dot(normalize(n),normalize(light-p)));float edge=selected>.5?.16:0.;gl_FragColor=vec4(min(vec3(1.),color*diffuse+edge),1.);}'
const PICK='precision mediump float;uniform vec3 color;void main(){gl_FragColor=vec4(color,1.);}'
function shader(gl:WebGLRenderingContext,type:number,src:string){const s=gl.createShader(type);if(!s)throw Error('shader');gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(String(gl.getShaderInfoLog(s)));return s}
function program(gl:WebGLRenderingContext,frag:string){const p=gl.createProgram();if(!p)throw Error('program');gl.attachShader(p,shader(gl,gl.VERTEX_SHADER,VS));gl.attachShader(p,shader(gl,gl.FRAGMENT_SHADER,frag));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(String(gl.getProgramInfoLog(p)));return p}
function multiply(a:number[],b:number[]){const o=new Array<number>(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o}
function projection(aspect:number){const f=1/Math.tan(Math.PI/7),near=.1,far=50;return[f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]}
function view(yaw:number,pitch:number,dist:number){const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);const eye=[dist*sy*cp,dist*sp+.5,dist*cy*cp],z=[eye[0],eye[1]-.5,eye[2]],zl=Math.hypot(...z);z.forEach((v,i)=>z[i]=v/zl);const x=[z[2],0,-z[0]],xl=Math.hypot(...x);x.forEach((v,i)=>x[i]=v/xl);const y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];return[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-x.reduce((s,v,i)=>s+v*eye[i],0),-y.reduce((s,v,i)=>s+v*eye[i],0),-z.reduce((s,v,i)=>s+v*eye[i],0),1]}
const IDENTITY=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]
export default function ThreeDPreview({modelId,colors,selected,onSelect}:Props){
 const canvas=useRef<HTMLCanvasElement>(null),orbit=useRef({yaw:.65,pitch:.33,dist:5.5}),drag=useRef<{x:number;y:number;moved:boolean}|null>(null),[error,setError]=useState('')
 const state=useRef({colors,selected,onSelect});state.current={colors,selected,onSelect}
 const render=useRef<((pick?:{x:number;y:number})=>void)|null>(null)
 useEffect(()=>{const el=canvas.current;if(!el||modelId!=='classic-low-top')return;const gl=el.getContext('webgl',{antialias:true,preserveDrawingBuffer:true});if(!gl){setError('WebGL unavailable on this device');return}
 let normal:WebGLProgram,picking:WebGLProgram;try{normal=program(gl,FS);picking=program(gl,PICK)}catch(e){setError(String(e));return}
 const parts=shape(),buffers=parts.map(part=>{const p=gl.createBuffer(),n=gl.createBuffer(),i=gl.createBuffer();if(!p||!n||!i)throw Error('WebGL buffer allocation failed');gl.bindBuffer(gl.ARRAY_BUFFER,p);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(part.vertices),gl.STATIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,n);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(part.normals),gl.STATIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,i);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(part.indices),gl.STATIC_DRAW);return{p,n,i,count:part.indices.length,id:part.id}})
 const draw=(pick?:{x:number;y:number})=>{const w=Math.max(1,el.clientWidth),h=Math.max(1,el.clientHeight),ratio=Math.min(devicePixelRatio||1,2);if(el.width!==Math.floor(w*ratio)||el.height!==Math.floor(h*ratio)){el.width=Math.floor(w*ratio);el.height=Math.floor(h*ratio)}gl.viewport(0,0,el.width,el.height);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.clearColor(.94,.95,.96,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT)
 const pr=pick?picking:normal;gl.useProgram(pr);gl.uniformMatrix4fv(gl.getUniformLocation(pr,'transform'),false,new Float32Array(multiply(projection(w/h),view(orbit.current.yaw,orbit.current.pitch,orbit.current.dist))));gl.uniformMatrix4fv(gl.getUniformLocation(pr,'world'),false,new Float32Array(IDENTITY));const light=gl.getUniformLocation(pr,'light');if(light)gl.uniform3f(light,3,5,7)
 buffers.forEach((b,idx)=>{gl.bindBuffer(gl.ARRAY_BUFFER,b.p);const pos=gl.getAttribLocation(pr,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,b.n);const norm=gl.getAttribLocation(pr,'normal');if(norm>=0){gl.enableVertexAttribArray(norm);gl.vertexAttribPointer(norm,3,gl.FLOAT,false,0,0)}gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,b.i);const rgb=pick?[(idx+1)/255,0,0]:hex(state.current.colors[b.id]||'#ffffff');gl.uniform3f(gl.getUniformLocation(pr,'color'),rgb[0],rgb[1],rgb[2]);const selectedLoc=gl.getUniformLocation(pr,'selected');if(selectedLoc)gl.uniform1f(selectedLoc,b.id===state.current.selected?1:0);gl.drawElements(gl.TRIANGLES,b.count,gl.UNSIGNED_SHORT,0)})
 if(pick){const pixel=new Uint8Array(4);gl.readPixels(Math.floor(pick.x*ratio),Math.floor(el.height-pick.y*ratio),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);const hit=buffers[pixel[0]-1];if(hit)state.current.onSelect(hit.id);requestAnimationFrame(()=>draw())}}
 render.current=draw;const resize=new ResizeObserver(()=>draw());resize.observe(el);draw();return()=>{resize.disconnect();render.current=null;buffers.forEach(b=>{gl.deleteBuffer(b.p);gl.deleteBuffer(b.n);gl.deleteBuffer(b.i)});gl.deleteProgram(normal);gl.deleteProgram(picking)}},[modelId])
 useEffect(()=>{render.current?.()},[colors,selected])
 if(modelId!=='classic-low-top')return <div className="preview-3d-empty">3D preview is currently available for Classic Low-Top. The 2D editor remains available for all models.</div>
 return <div className="preview-3d"><canvas ref={canvas} aria-label="Interactive 3D low-top sneaker" onPointerDown={e=>{drag.current={x:e.clientX,y:e.clientY,moved:false};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{const d=drag.current;if(!d)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.abs(dx)+Math.abs(dy)>2)d.moved=true;orbit.current.yaw+=dx*.008;orbit.current.pitch=clamp(orbit.current.pitch+dy*.008,-1.1,1.2);d.x=e.clientX;d.y=e.clientY;render.current?.()}} onPointerUp={e=>{const d=drag.current;drag.current=null;if(d&&!d.moved){const rect=e.currentTarget.getBoundingClientRect();render.current?.({x:e.clientX-rect.left,y:e.clientY-rect.top})}}} onWheel={e=>{orbit.current.dist=clamp(orbit.current.dist+e.deltaY*.004,3.3,10);render.current?.()}}/><div className="preview-3d-controls"><button onClick={()=>{orbit.current={yaw:.65,pitch:.33,dist:5.5};render.current?.()}}>Reset view</button><button onClick={()=>{orbit.current.dist=clamp(orbit.current.dist-.5,3.3,10);render.current?.()}}>＋</button><button onClick={()=>{orbit.current.dist=clamp(orbit.current.dist+.5,3.3,10);render.current?.()}}>－</button></div><p className="preview-3d-note">Drag to rotate · Scroll to zoom · Click a component to select · First 3D prototype, not yet a photorealistic GLB model.</p>{error&&<p role="alert">{error}</p>}</div>
}
function hex(value:string):number[]{const v=value.replace('#','');return[0,2,4].map(i=>parseInt(v.slice(i,i+2),16)/255)}
