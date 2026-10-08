import type { PanelColors } from './shoeTemplate'
import type { ArtworkItem } from './ArtworkLayer'

export type LayerId = 'artwork' | 'freehand' | 'base'

export type LayerState = {
  id: LayerId
  name: string
  visible: boolean
}

export type ProjectFile = {
  format: 'sneaker-design-studio'
  version: 1
  name: string
  updatedAt: string
  template: 'classic-low-top-v1'
  colors: PanelColors
  artworks: ArtworkItem[]
  layers: LayerState[]
}

export const DEFAULT_LAYERS: LayerState[] = [
  { id: 'artwork', name: 'Uploaded Artwork', visible: true },
  { id: 'freehand', name: 'Freehand Details', visible: true },
  { id: 'base', name: 'Base Colors', visible: true },
]

export const makeProject = (
  name: string,
  colors: PanelColors,
  artworks: ArtworkItem[],
  layers: LayerState[],
): ProjectFile => ({
  format: 'sneaker-design-studio',
  version: 1,
  name,
  updatedAt: new Date().toISOString(),
  template: 'classic-low-top-v1',
  colors,
  artworks,
  layers,
})

export function isProjectFile(value: unknown): value is ProjectFile {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<ProjectFile>
  return item.format === 'sneaker-design-studio' && item.version === 1 &&
    typeof item.name === 'string' && !!item.colors && Array.isArray(item.artworks) && Array.isArray(item.layers)
}

const KEY = 'sneaker-design-studio:last-project'

export function saveLocal(project: ProjectFile) {
  localStorage.setItem(KEY, JSON.stringify(project))
}

export function loadLocal(): ProjectFile | null {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return isProjectFile(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function downloadProject(project: ProjectFile) {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = project.name.trim().replace(/[^a-z0-9-_]+/gi, '-') + '.shoeproject'
  anchor.click()
  URL.revokeObjectURL(url)
}
