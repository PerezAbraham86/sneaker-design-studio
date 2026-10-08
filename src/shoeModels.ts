import type {PanelColors,PanelId} from './shoeTemplate'
import {initialColors,panelLabels,panelPaths} from './shoeTemplate'
import {dedicatedViews} from './shoeViews'
import type {ShoeView} from './project'

export type ShoeViewTemplate={
 viewBox:string
 paths:Partial<Record<PanelId,string>>
 details:string[]
 mirror?:boolean
}
export type ShoeModel={
 id:string
 name:string
 category:'low-top'|'high-top'|'slip-on'
 version:number
 description:string
 panelLabels:Record<PanelId,string>
 initialColors:PanelColors
 views:Record<ShoeView,ShoeViewTemplate>
}

const side: ShoeViewTemplate={viewBox:'55 55 735 350',paths:panelPaths,details:[]}

export const CLASSIC_LOW_TOP:ShoeModel={
 id:'classic-low-top',
 name:'Classic Low-Top',
 category:'low-top',
 version:1,
 description:'Panel-based low-top prototype for custom artwork and paint planning.',
 panelLabels,
 initialColors,
 views:{
  outer:side,
  inner:{...side,mirror:true},
  top:dedicatedViews.top,
  front:dedicatedViews.front,
  heel:dedicatedViews.heel,
 }
}

export const SHOE_MODELS:Record<string,ShoeModel>={
 [CLASSIC_LOW_TOP.id]:CLASSIC_LOW_TOP,
}

export const DEFAULT_SHOE_MODEL_ID=CLASSIC_LOW_TOP.id
export const getShoeModel=(id:string)=>SHOE_MODELS[id]??CLASSIC_LOW_TOP
export const modelPanels=(model:ShoeModel,view:ShoeView)=>
 Object.keys(model.views[view].paths) as PanelId[]
