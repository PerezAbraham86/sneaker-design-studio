import type {PanelId} from './shoeTemplate'
import type {ShoeView} from './project'
export type SurfaceMaterial='leather'|'textile'|'rubber'|'mesh'|'synthetic'
export type ModelPart={id:string;panelId:PanelId;label:string;material:SurfaceMaterial;customizable:boolean;views:ShoeView[];futureMeshName:string}
export type ModelManifest={schema:'sneaker-design-studio-model';version:1;modelId:string;coordinateSystem:{width:number;height:number;units:'design'};parts:ModelPart[]}
export const LOW_TOP_MODEL_MANIFEST:ModelManifest={schema:'sneaker-design-studio-model',version:1,modelId:'classic-low-top',coordinateSystem:{width:800,height:430,units:'design'},parts:[
{id:'upper.toe-box',panelId:'toeBox',label:'Toe box / vamp',material:'leather',customizable:true,views:['outer','inner','top','front'],futureMeshName:'upper_toe_box'},
{id:'upper.toe-guard',panelId:'toeGuard',label:'Toe guard / tip',material:'leather',customizable:true,views:['outer','inner','top','front'],futureMeshName:'upper_toe_guard'},
{id:'upper.quarter',panelId:'quarter',label:'Quarter / side panel',material:'leather',customizable:true,views:['outer','inner','top','heel'],futureMeshName:'upper_quarter'},
{id:'upper.eyestay',panelId:'eyestay',label:'Eyestay',material:'leather',customizable:true,views:['outer','inner','top'],futureMeshName:'upper_eyestay'},
{id:'upper.heel',panelId:'heel',label:'Heel / backtab zone',material:'leather',customizable:true,views:['outer','inner','heel'],futureMeshName:'upper_heel'},
{id:'upper.collar',panelId:'collar',label:'Collar / lining',material:'textile',customizable:true,views:['outer','inner','top','heel'],futureMeshName:'upper_collar'},
{id:'upper.tongue',panelId:'tongue',label:'Tongue',material:'textile',customizable:true,views:['outer','inner','top','front'],futureMeshName:'upper_tongue'},
{id:'sole.midsole',panelId:'midsole',label:'Midsole',material:'rubber',customizable:true,views:['outer','inner','front','heel'],futureMeshName:'sole_midsole'},
{id:'sole.outsole',panelId:'outsole',label:'Outsole',material:'rubber',customizable:true,views:['outer','inner','top','front','heel'],futureMeshName:'sole_outsole'}]}
export const manifestForModel=(modelId:string)=>modelId==='classic-low-top'?LOW_TOP_MODEL_MANIFEST:null
export const partsForView=(modelId:string,view:ShoeView)=>manifestForModel(modelId)?.parts.filter(p=>p.views.includes(view))??[]
export const partForPanel=(modelId:string,panelId:PanelId)=>manifestForModel(modelId)?.parts.find(p=>p.panelId===panelId)??null
