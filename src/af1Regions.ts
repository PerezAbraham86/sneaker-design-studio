export const AF1_REGION_GROUPS = [
  { label: 'Upper', regions: ['tip','vamp','eyestay','quarterLeft','quarterRight'] },
  { label: 'Swoosh', regions: ['swooshLeft','swooshRight'] },
  { label: 'Tongue & Laces', regions: ['tongue','laces'] },
  { label: 'Lining', regions: ['liningLeft','liningRight'] },
  { label: 'Backtab', regions: ['backtab','backtabLogo'] },
  { label: 'Sole', regions: ['midsole','midsoleStripe','midsoleLogo','outsole'] },
  { label: 'Details', regions: ['seams'] },
] as const

export type AF1RegionId = typeof AF1_REGION_GROUPS[number]['regions'][number]
export type AF1RegionColors = Record<AF1RegionId,string>

export const AF1_REGION_LABELS: Record<AF1RegionId,string> = {
  tip:'Tip', vamp:'Vamp', eyestay:'Eyestay', quarterLeft:'Quarter Left', quarterRight:'Quarter Right',
  swooshLeft:'Swoosh Left', swooshRight:'Swoosh Right', tongue:'Tongue', laces:'Laces',
  liningLeft:'Lining Left', liningRight:'Lining Right', backtab:'Backtab', backtabLogo:'Backtab Logo',
  midsole:'Midsole', midsoleStripe:'Midsole Stripe', midsoleLogo:'Midsole Logo', outsole:'Outsole', seams:'Seams'
}

export const AF1_REGION_IDS = AF1_REGION_GROUPS.flatMap(group => [...group.regions]) as AF1RegionId[]

export const makeAF1RegionColors = (): AF1RegionColors =>
  Object.fromEntries(AF1_REGION_IDS.map(id => [id,'#ffffff'])) as AF1RegionColors
