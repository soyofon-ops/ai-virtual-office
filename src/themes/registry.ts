import type { Theme, ThemeId, ThemeRegistry } from '../types/theme'
import { stubOfficeLayout } from './layoutStub'

const themes = new Map<ThemeId, Theme>()

const placeholderTokens = {
  floor: '#d4c4a8',
  wall: '#e8dcc8',
  desk: '#8b6914',
  bubbleQuestion: '#f59e0b',
  bubbleError: '#ef4444',
  font: 'system-ui, sans-serif',
}

const cozyStub: Theme = {
  id: 'cozy',
  label: '溫馨木質',
  primevuePreset: {},
  tokens: placeholderTokens,
  layout: stubOfficeLayout,
  avatars: {
    default: { sprite: 'default', size: 24 },
  },
}

const pixelStub: Theme = {
  id: 'pixel',
  label: '像素風',
  primevuePreset: {},
  tokens: placeholderTokens,
  layout: stubOfficeLayout,
  avatars: {
    default: { sprite: 'default', size: 24 },
  },
}

export const themeRegistry: ThemeRegistry = {
  defaultId: 'cozy',
  register(theme: Theme) {
    themes.set(theme.id, theme)
  },
  get(id: ThemeId) {
    return themes.get(id)
  },
  list() {
    return [...themes.values()]
  },
}

themeRegistry.register(cozyStub)
themeRegistry.register(pixelStub)

export function layoutForTheme(themeId: ThemeId) {
  return themeRegistry.get(themeId)?.layout ?? stubOfficeLayout
}
