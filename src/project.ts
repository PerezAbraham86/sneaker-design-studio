import type { PanelColors } from './shoeTemplate'
import type { ArtworkItem } from './ArtworkLayer'
import type { Stroke } from './DrawingCanvas'

export type LayerId='artwork'|'freehand'|'base'
export type LayerState={id:LayerId;name:string;visible:boolean}
export type ProjectFile={
 format:'sneaker-design-studio';version:2;name:string;updatedAt:string;template:'classic-low-top-v1';
 colors:PanelColors;artworks:ArtworkItem[];strokes:Stroke[];layers:LayerState[]
}
export const DEFAULT_LAYERS:LayerState[]=[
 {id:'artwork',name:'Uploaded Artwork',visible:true},{id:'freehand',name:'Freehand Details',visible:true},{id:'base',name:'Base Colors',visible:true},
]
export const makeProject=(name:string,colors:PanelColors,artworks:ArtworkItem[],strokes:Stroke[],layers:LayerState[]):ProjectFile=>({
 format:'sneaker-design-studio',version:2,name,updatedAt:new Date().toISOString(),template:'classic-low-top-v1',colors,artworks,strokes,layers,
})
export function isProjectFile(v:unknown):v is ProjectFile{
 if(!v||typeof v!=='object')return false;const x=v as Partial<ProjectFile>
 return x.format==='sneaker-design-studio'&&x.version===2&&typeof x.name==='string'&&!!x.colors&&Array.isArray(x.artworks)&&Array.isArray(x.strokes)&&Array.isArray(x.layers)
}
const KEY='sneaker-design-studio:last-project'
export function saveLocal(p:ProjectFile){localStorage.setItem(KEY,JSON.stringify(p))}
export function loadLocal():ProjectFile|null{const raw=localStorage.getItem(KEY);if(!raw)return null;try{const p:unknown=JSON.parse(raw);return isProjectFile(p)?p:null}catch{return null}}
export function downloadProject(p:ProjectFile){const b=new Blob([JSON.stringify(p,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=p.name.trim().replace(/[^a-z0-9-_]+/gi,'-')+'.shoeproject';a.click();URL.revokeObjectURL(u)}
