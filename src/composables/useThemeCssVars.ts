import { watchEffect, type Ref } from 'vue'
import { themeRegistry } from '../themes/registry'
import type { ThemeId } from '../types/theme'

const OFFICE_VAR_KEYS = [
  'floor',
  'wall',
  'desk',
  'bubbleQuestion',
  'bubbleError',
  'font',
] as const

export function applyThemeCssVars(themeId: ThemeId, root: HTMLElement = document.documentElement) {
  const theme = themeRegistry.get(themeId)
  if (!theme) return
  for (const key of OFFICE_VAR_KEYS) {
    root.style.setProperty(`--office-${key}`, theme.tokens[key])
  }
  root.style.setProperty('font-family', theme.tokens.font)
}

export function useThemeCssVars(themeId: Ref<ThemeId>) {
  watchEffect(() => {
    if (typeof document === 'undefined') return
    applyThemeCssVars(themeId.value)
  })
}
