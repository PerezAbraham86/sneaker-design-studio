import type {PanelId} from './shoeTemplate'
import {LOW_TOP_MODEL_MANIFEST} from './modelManifest'
export type GlbPart={id:PanelId;vertices:number[];normals:number[];indices:number[]}
type Accessor={bufferView?:number;byteOffset?:number;componentType:number;count:number;type:string}
type BufferView={buffer:number;byteOffset?:number;byteLength:number;byteStride?:number}
type Primitive={attributes:Record<string,number>;indices?:number;mode?:number}
type Mesh={name?:string;primitives:Primitive[]}
type Node={mesh?:number;children?:number[];translation?:number[];scale?:number[];rotation?:number[];matrix?:number[]}
const comps:Record<string,number>={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}
function readAccessor(a:Accessor,views:BufferView[],bin:DataView):number[]{
 if(a.bufferView===undefined||!comps[a.type])throw Error('Unsupported GLB accessor')
 const v=views[a.bufferView];if(v.buffer!==0)throw Error('External GLB buffers unsupported')
 const width=a.componentType===5126||a.componentType===5125?4:a.componentType===5123||a.componentType===5122?2:1
 const stride=v.byteStride??width*comps[a.type],offset=(v.byteOffset??0)+(a.byteOffset??0)
 const out:number[]=[]
 for(let i=0;i<a.count;i++)for(let j=0;j<comps[a.type];j++){
  const p=offset+i*stride+j*width;if(p+width>bin.byteLength)throw Error('GLB accessor out of bounds')
  const n=a.componentType===5126?bin.getFloat32(p,true):a.componentType===5125?bin.getUint32(p,true):a.componentType===5123?bin.getUint16(p,true):a.componentType===5121?bin.getUint8(p):NaN
  if(!Number.isFinite(n))throw Error('Unsupported GLB component type');out.push(n)
 }return out
}
function nodeMatrix(n:Node):number[]{
 if(n.matrix)return n.matrix
 const [x,y,z,w]=n.rotation??[0,0,0,1], [sx,sy,sz]=n.scale??[1,1,1], [tx,ty,tz]=n.translation??[0,0,0]
 return [(1-2*(y*y+z*z))*sx,2*(x*y+z*w)*sx,2*(x*z-y*w)*sx,0,2*(x*y-z*w)*sy,(1-2*(x*x+z*z))*sy,2*(y*z+x*w)*sy,0,2*(x*z+y*w)*sz,2*(y*z-x*w)*sz,(1-2*(x*x+y*y))*sz,0,tx,ty,tz,1]
}
function mul(a:number[],b:number[]){const o=Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o}
const I=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]
export function parseSneakerGlb(bytes:ArrayBuffer):GlbPart[]{
 const data=new DataView(bytes);if(data.byteLength<20||data.getUint32(0,true)!==0x46546c67||data.getUint32(4,true)!==2||data.getUint32(8,true)!==data.byteLength)throw Error('Invalid GLB v2 header')
 let pos=12,json:any=null,bin:DataView|null=null
 while(pos+8<=data.byteLength){const len=data.getUint32(pos,true),type=data.getUint32(pos+4,true);pos+=8;if(pos+len>data.byteLength)throw Error('Invalid GLB chunk')
 if(type===0x4e4f534a)json=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,pos,len)))
 if(type===0x004e4942)bin=new DataView(bytes,pos,len);pos+=len}
 if(!json||!bin)throw Error('GLB missing JSON or binary geometry')
 const accessors=json.accessors as Accessor[],views=json.bufferViews as BufferView[],meshes=json.meshes as Mesh[],nodes=json.nodes as Node[]
 if(!accessors||!views||!meshes||!nodes)throw Error('GLB missing mesh structures')
 const byName=new Map(LOW_TOP_MODEL_MANIFEST.parts.map(p=>[p.futureMeshName,p.panelId]))
 const result:GlbPart[]=[]
 const walk=(index:number,parent:number[])=>{const n=nodes[index],m=mul(parent,nodeMatrix(n));if(n.mesh!==undefined){const mesh=meshes[n.mesh];const name=mesh.name??'';const panel=byName.get(name)
 if(panel)for(const prim of mesh.primitives){if(prim.mode!==undefined&&prim.mode!==4)continue
 const p=readAccessor(accessors[prim.attributes.POSITION],views,bin!),norm=prim.attributes.NORMAL!==undefined?readAccessor(accessors[prim.attributes.NORMAL],views,bin!):[]
 const inds=prim.indices!==undefined?readAccessor(accessors[prim.indices],views,bin!):Array.from({length:p.length/3},(_,i)=>i)
 if(p.length/3>65535||inds.some(i=>i>65535))throw Error('GLB mesh exceeds WebGL1 16-bit index limit')
 const vertices:number[]=[],normals:number[]=[]
 for(let k=0;k<p.length;k+=3){const x=p[k],y=p[k+1],z=p[k+2];vertices.push(m[0]*x+m[4]*y+m[8]*z+m[12],m[1]*x+m[5]*y+m[9]*z+m[13],m[2]*x+m[6]*y+m[10]*z+m[14])
 const nx=norm[k]??0,ny=norm[k+1]??1,nz=norm[k+2]??0;const a=m[0]*nx+m[4]*ny+m[8]*nz,b=m[1]*nx+m[5]*ny+m[9]*nz,c=m[2]*nx+m[6]*ny+m[10]*nz,l=Math.hypot(a,b,c)||1;normals.push(a/l,b/l,c/l)}
 result.push({id:panel,vertices,normals,indices:inds})}}
 n.children?.forEach(child=>walk(child,m))}
 const roots=json.scenes?.[json.scene??0]?.nodes??nodes.map((_:Node,i:number)=>i).filter((i:number)=>!nodes.some(n=>n.children?.includes(i)))
 roots.forEach((i:number)=>walk(i,I))
 if(!result.length)throw Error('GLB contains no named paintable sneaker meshes')
 const missing=LOW_TOP_MODEL_MANIFEST.parts.filter(p=>!result.some(r=>r.id===p.panelId)).map(p=>p.futureMeshName)
 if(missing.length)throw Error('Missing paintable meshes: '+missing.join(', '))
 // Center and normalize the shoe to the current preview camera.
 const coords=result.flatMap(p=>p.vertices),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity]
 for(let i=0;i<coords.length;i+=3)for(let a=0;a<3;a++){min[a]=Math.min(min[a],coords[i+a]);max[a]=Math.max(max[a],coords[i+a])}
 const size=Math.max(max[0]-min[0],max[1]-min[1],max[2]-min[2]);if(!size)throw Error('Empty shoe geometry')
 const scale=3.25/size,center=min.map((v,i)=>(v+max[i])/2)
 result.forEach(p=>{for(let i=0;i<p.vertices.length;i++)p.vertices[i]=(p.vertices[i]-center[i%3])*scale})
 return result
}
