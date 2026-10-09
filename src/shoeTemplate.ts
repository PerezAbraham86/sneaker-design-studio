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
  heel: 'M92 244 C92 184 110 132 151 98 C178 76 211 69 244 77 L270 105 L253 244 L157 271 L103 275 Z',
  collar: 'M151 99 C181 65 229 57 279 73 C300 80 318 92 334 108 L309 137 C283 121 257 113 228 113 C199 113 176 121 157 139 Z',
  tongue: 'M244 112 C259 88 292 82 321 99 L367 225 L315 246 L279 177 L239 176 Z',
  quarter: 'M224 143 C290 136 365 131 438 132 C486 133 529 144 566 166 C589 180 609 198 625 221 L589 269 C528 266 469 267 409 270 L224 263 Z',
  eyestay: 'M251 126 L326 111 L384 224 L326 244 L286 166 L239 168 Z',
  toeBox: 'M438 151 C494 143 558 149 612 166 C650 178 682 197 701 220 C714 236 718 250 711 263 C659 256 602 254 546 259 L500 270 L475 213 Z',
  toeGuard: 'M500 269 C557 251 626 250 689 259 C718 263 740 274 751 291 C755 297 755 304 752 310 L511 309 L477 286 Z',
  midsole: 'M91 277 C205 287 345 291 505 285 L741 287 C758 288 767 300 761 317 C751 344 713 356 660 356 L158 349 C113 346 91 324 91 277 Z',
  outsole: 'M126 346 L686 354 C720 353 746 341 761 317 L758 341 C746 370 708 384 654 385 L167 378 C141 375 128 363 126 346 Z',
}
