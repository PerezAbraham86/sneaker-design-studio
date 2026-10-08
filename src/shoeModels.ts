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


const highOuter: ShoeViewTemplate={viewBox:'55 20 735 385',paths:{
 heel:'M92 230 C92 142 116 72 174 38 L245 58 L238 252 L102 277 Z',
 collar:'M153 50 C190 12 257 14 312 47 L281 96 L205 94 Z',
 tongue:'M239 69 C260 43 296 39 326 57 L375 230 L286 242 Z',
 quarter:'M221 116 L445 108 C500 112 544 142 574 190 L527 273 L224 263 Z',
 eyestay:'M258 91 L340 75 L392 221 L329 241 L288 139 L239 142 Z',
 toeBox:panelPaths.toeBox,toeGuard:panelPaths.toeGuard,midsole:panelPaths.midsole,outsole:panelPaths.outsole
},details:['M274 105 L330 94','M282 126 L339 115','M291 147 L347 136','M299 168 L355 157']}

const highTop: ShoeViewTemplate={viewBox:'0 0 800 430',paths:{
 outsole:dedicatedViews.top.paths.outsole!,midsole:dedicatedViews.top.paths.midsole!,
 heel:'M268 55 C318 25 482 25 532 55 L512 122 C463 104 337 104 288 122 Z',
 collar:'M286 92 C333 65 467 65 514 92 L492 169 C448 149 352 149 308 169 Z',
 tongue:'M331 112 C354 88 446 88 469 112 L477 288 C452 307 348 307 323 288 Z',
 toeGuard:dedicatedViews.top.paths.toeGuard!,toeBox:dedicatedViews.top.paths.toeBox!
},details:['M360 143 L440 143 M357 167 L443 167 M354 191 L446 191 M351 215 L449 215 M348 239 L452 239']}

const highFront: ShoeViewTemplate={viewBox:'0 0 800 430',paths:{
 outsole:dedicatedViews.front.paths.outsole!,midsole:dedicatedViews.front.paths.midsole!,toeGuard:dedicatedViews.front.paths.toeGuard!,toeBox:dedicatedViews.front.paths.toeBox!,
 tongue:'M342 47 C368 22 432 22 458 47 L472 202 C447 222 353 222 328 202 Z',
 collar:'M292 55 C328 15 472 15 508 55 L478 105 C442 86 358 86 322 105 Z'
},details:['M365 80 L435 80 M362 104 L438 104 M359 128 L441 128 M356 152 L444 152']}

const highHeel: ShoeViewTemplate={viewBox:'0 0 800 430',paths:{
 outsole:dedicatedViews.heel.paths.outsole!,midsole:dedicatedViews.heel.paths.midsole!,
 heel:'M270 102 C300 65 500 65 530 102 L553 293 C508 320 292 320 247 293 Z',
 collar:'M286 53 C323 12 477 12 514 53 L482 113 C444 91 356 91 318 113 Z',
 quarter:'M247 126 C265 94 291 78 320 77 L294 286 L247 293 Z M553 126 C535 94 509 78 480 77 L506 286 L553 293 Z'
},details:['M400 105 L400 292','M320 142 C363 124 437 124 480 142']}

export const CLASSIC_HIGH_TOP:ShoeModel={
 id:'classic-high-top',name:'Classic High-Top',category:'high-top',version:1,
 description:'Generic high-top sneaker anatomy with extended ankle, collar, tongue, and eyestay areas.',
 panelLabels,initialColors,
 views:{outer:highOuter,inner:{...highOuter,mirror:true},top:highTop,front:highFront,heel:highHeel}
}

export const SHOE_MODELS:Record<string,ShoeModel>={
 [CLASSIC_LOW_TOP.id]:CLASSIC_LOW_TOP,
 [CLASSIC_HIGH_TOP.id]:CLASSIC_HIGH_TOP,
}

export const DEFAULT_SHOE_MODEL_ID=CLASSIC_LOW_TOP.id
export const getShoeModel=(id:string)=>SHOE_MODELS[id]??CLASSIC_LOW_TOP
export const modelPanels=(model:ShoeModel,view:ShoeView)=>
 Object.keys(model.views[view].paths) as PanelId[]
