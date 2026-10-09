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
 fidelity:'prototype'|'refined'
 coordinateSystem:{width:number;height:number;units:'design'}
 description:string
 panelLabels:Record<PanelId,string>
 initialColors:PanelColors
 views:Record<ShoeView,ShoeViewTemplate>
}

const side: ShoeViewTemplate={viewBox:'55 45 735 355',paths:panelPaths,details:['M112 281 C225 288 350 290 470 286','M175 105 C202 92 231 89 260 95','M278 139 L333 128','M285 157 L341 146','M293 176 L350 165','M301 195 L359 184','M309 214 L367 203','M454 166 C505 160 554 169 594 191','M516 280 C576 263 648 260 704 272','M151 349 C292 352 472 354 650 355','M113 299 C265 307 443 307 610 302','M210 151 C204 190 204 225 217 260','M410 139 C425 176 442 211 482 276']}

export const CLASSIC_LOW_TOP:ShoeModel={
 id:'classic-low-top',
 name:'Classic Low-Top',
 category:'low-top',
 version:4,
 fidelity:'refined',coordinateSystem:{width:800,height:430,units:'design'},
 description:'Production 2D low-top template rebuilt around realistic cupsole sneaker proportions, panel overlaps, lace guides, seam construction, and independently paintable surfaces.',
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
 id:'classic-high-top',name:'Classic High-Top',category:'high-top',version:2,
 fidelity:'refined',coordinateSystem:{width:800,height:430,units:'design'},
 description:'Generic high-top sneaker anatomy with extended ankle, collar, tongue, and eyestay areas.',
 panelLabels,initialColors,
 views:{outer:highOuter,inner:{...highOuter,mirror:true},top:highTop,front:highFront,heel:highHeel}
}


const slipSide:ShoeViewTemplate={viewBox:'55 70 735 335',paths:{
 heel:'M92 247 C96 176 123 126 181 102 L246 125 L238 273 L104 294 Z',
 collar:'M170 111 C207 84 275 85 326 116 L292 154 L213 151 Z',
 quarter:'M222 145 L445 137 C505 141 552 172 580 220 L530 289 L224 282 Z',
 toeBox:panelPaths.toeBox,toeGuard:panelPaths.toeGuard,midsole:panelPaths.midsole,outsole:panelPaths.outsole
},details:['M252 151 C310 172 363 174 423 150']}

const slipTop:ShoeViewTemplate={viewBox:'0 0 800 430',paths:{
 outsole:dedicatedViews.top.paths.outsole!,midsole:dedicatedViews.top.paths.midsole!,
 heel:'M286 72 C335 45 465 45 514 72 L493 132 C449 114 351 114 307 132 Z',
 collar:'M307 111 C344 91 456 91 493 111 L473 170 C435 153 365 153 327 170 Z',
 quarter:'M314 155 C350 139 450 139 486 155 L500 283 C458 303 342 303 300 283 Z',
 toeGuard:dedicatedViews.top.paths.toeGuard!,toeBox:dedicatedViews.top.paths.toeBox!
},details:['M329 176 C370 194 430 194 471 176']}

const slipFront:ShoeViewTemplate={viewBox:'0 0 800 430',paths:{
 outsole:dedicatedViews.front.paths.outsole!,midsole:dedicatedViews.front.paths.midsole!,toeGuard:dedicatedViews.front.paths.toeGuard!,toeBox:dedicatedViews.front.paths.toeBox!,
 quarter:'M312 103 C349 78 451 78 488 103 L474 222 C435 241 365 241 326 222 Z',
 collar:'M326 80 C358 59 442 59 474 80 L457 119 C426 105 374 105 343 119 Z'
},details:['M334 133 C371 149 429 149 466 133']}

const slipHeel:ShoeViewTemplate={viewBox:'0 0 800 430',paths:{
 outsole:dedicatedViews.heel.paths.outsole!,midsole:dedicatedViews.heel.paths.midsole!,
 heel:'M277 120 C310 84 490 84 523 120 L541 292 C497 317 303 317 259 292 Z',
 collar:'M301 82 C337 53 463 53 499 82 L477 126 C442 109 358 109 323 126 Z',
 quarter:'M259 146 C278 117 302 104 329 103 L305 286 L259 292 Z M541 146 C522 117 498 104 471 103 L495 286 L541 292 Z'
},details:['M400 118 L400 291']}
export const CLASSIC_SLIP_ON:ShoeModel={
 id:'classic-slip-on',name:'Classic Slip-On',category:'slip-on',version:2,
 fidelity:'refined',coordinateSystem:{width:800,height:430,units:'design'},
 description:'Generic laceless slip-on anatomy with simplified vamp, collar, and side construction.',
 panelLabels,initialColors,
 views:{outer:slipSide,inner:{...slipSide,mirror:true},top:slipTop,front:slipFront,heel:slipHeel}
}

export const SHOE_MODELS:Record<string,ShoeModel>={
 [CLASSIC_LOW_TOP.id]:CLASSIC_LOW_TOP,
 [CLASSIC_HIGH_TOP.id]:CLASSIC_HIGH_TOP,
 [CLASSIC_SLIP_ON.id]:CLASSIC_SLIP_ON,
}

export const DEFAULT_SHOE_MODEL_ID=CLASSIC_LOW_TOP.id
export const getShoeModel=(id:string)=>SHOE_MODELS[id]??CLASSIC_LOW_TOP
export const modelPanels=(model:ShoeModel,view:ShoeView)=>
 Object.keys(model.views[view].paths) as PanelId[]
