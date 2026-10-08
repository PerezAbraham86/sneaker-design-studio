import type { PanelColors } from './shoeTemplate'
import type { ArtworkItem } from './ArtworkLayer'
import type { Stroke } from './DrawingCanvas'
export type ShoeView='outer'|'inner'|'top'|'front'|'heel'
export type LayerId='artwork'|'freehand'|'base'
export type LayerState={id:LayerId;name:string;visible:boolean}
export type ViewDocument={colors:PanelColors;artworks:ArtworkItem[];strokes:Stroke[]}
export type ProjectFile={format:'sneaker-design-studio';version:4;name:string;updatedAt:string;modelId:string;activeView:ShoeView;views:Record<ShoeView,ViewDocument>;layers:LayerState[]}
export const VIEW_LABELS:Record<ShoeView,string>={outer:'Outer',inner:'Inner',top:'Top',front:'Front / Toe',heel:'Heel'}
export const SHOE_VIEWS:ShoeView[]=['outer','inner','top','front','heel']
export const DEFAULT_LAYERS:LayerState[]=[{id:'artwork',name:'Uploaded Artwork',visible:true},{id:'freehand',name:'Freehand Details',visible:true},{id:'base',name:'Base Colors',visible:true}]
export const makeProject=(name:string,modelId:string,activeView:ShoeView,views:Record<ShoeView,ViewDocument>,layers:LayerState[]):ProjectFile=>({format:'sneaker-design-studio',version:4,name,updatedAt:new Date().toISOString(),modelId,activeView,views,layers})
export function isProjectFile(v:unknown):v is ProjectFile{if(!v||typeof v!=='object')return false;const x=v as Partial<ProjectFile>;return x.format==='sneaker-design-studio'&&x.version===4&&typeof x.name==='string'&&typeof x.modelId==='string'&&!!x.views&&Array.isArray(x.layers)}
const KEY='sneaker-design-studio:last-project'
export function saveLocal(p:ProjectFile){localStorage.setItem(KEY,JSON.stringify(p))}
export function loadLocal():ProjectFile|null{const raw=localStorage.getItem(KEY);if(!raw)return null;try{const p:unknown=JSON.parse(raw);return isProjectFile(p)?p:null}catch{return null}}
export function downloadProject(p:ProjectFile){const b=new Blob([JSON.stringify(p,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=p.name.trim().replace(/[^a-z0-9-_]+/gi,'-')+'.shoeproject';a.click();URL.revokeObjectURL(u)}
