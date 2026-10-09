export type PanelId =
  | 'toeBox'
  | 'toeGuard'
  | 'quarter'
  | 'eyestay'
  | 'heel'
  | 'collar'
  | 'tongue'
  | 'midsole'
  | 'outsole'

export type PanelColors = Record<PanelId, string>

export const panelLabels: Record<PanelId, string> = {
  toeBox: 'Toe box',
  toeGuard: 'Toe guard',
  quarter: 'Side panel',
  eyestay: 'Eyestay',
  heel: 'Heel',
  collar: 'Collar',
  tongue: 'Tongue',
  midsole: 'Midsole',
  outsole: 'Outsole',
}

export const initialColors: PanelColors = {
  toeBox: '#f8f8f6',
  toeGuard: '#ffffff',
  quarter: '#ffffff',
  eyestay: '#f3f3ef',
  heel: '#efefeb',
  collar: '#e6e6e1',
  tongue: '#f7f7f4',
  midsole: '#e7e7e2',
  outsole: '#cfcfc8',
}

export const panelPaths: Record<PanelId, string> = {
  heel: 'M96 263 C96 211 104 170 126 137 C146 108 174 91 209 84 C232 79 252 81 274 88 L300 112 L285 260 L179 281 L118 282 Z',
  collar: 'M169 105 C193 77 232 67 273 75 C299 80 321 91 340 108 L319 139 C294 124 268 117 239 117 C213 117 192 124 176 140 L157 132 Z',
  tongue: 'M263 111 C279 91 309 88 332 102 L377 226 L330 245 L291 174 L252 174 Z',
  quarter: 'M217 149 C274 139 339 136 410 139 L479 145 C508 149 536 159 561 174 C585 189 605 208 622 231 L592 270 C535 267 477 269 414 274 L286 268 L217 260 Z',
  eyestay: 'M253 126 L326 112 L385 225 L329 246 L289 171 L247 171 Z',
  toeBox: 'M446 158 C489 149 537 151 581 160 C624 169 660 185 685 207 C702 222 711 239 710 255 C665 249 620 249 576 254 C542 258 511 265 482 276 L458 226 L425 188 Z',
  toeGuard: 'M482 276 C522 259 570 251 621 251 C663 251 700 257 726 270 C746 280 758 294 758 307 L751 315 L508 313 L472 293 Z',
  midsole: 'M94 280 C202 289 327 292 468 288 C563 285 652 282 731 287 C751 288 762 299 760 315 C757 339 725 351 672 354 L171 350 C126 348 100 330 94 280 Z',
  outsole: 'M128 347 C269 352 441 354 665 354 C707 353 739 342 758 318 L756 341 C744 369 706 382 653 383 L170 377 C145 375 132 365 128 347 Z',
}
