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
  heel: 'M92 230 C96 170 123 121 176 95 L239 111 L235 251 L102 277 Z',
  collar: 'M158 103 C187 69 243 66 292 93 L264 137 L205 135 Z',
  tongue: 'M235 112 C250 91 281 86 309 102 L348 230 L267 239 Z',
  quarter: 'M220 139 L442 130 C493 133 535 155 566 194 L524 273 L224 263 Z',
  eyestay: 'M253 125 L330 111 L381 224 L326 239 L287 163 L238 165 Z',
  toeBox: 'M437 150 C516 142 608 159 671 202 C695 219 706 240 699 260 L514 269 L493 209 Z',
  toeGuard: 'M506 263 C565 250 650 247 708 263 C731 270 746 284 743 299 L512 304 L478 282 Z',
  midsole: 'M91 275 C203 286 343 291 503 284 L742 286 C757 288 765 299 758 315 C746 339 711 350 661 351 L158 343 C116 340 91 321 91 275 Z',
  outsole: 'M126 340 L687 348 C718 347 742 338 758 315 L755 338 C744 365 707 379 655 380 L167 373 C142 370 128 358 126 340 Z',
}
