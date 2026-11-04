import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import {
  clearPersistedOffice,
  readPersistedOffice,
  useOfficeStore,
} from '../src/stores/office'

describe('office store', () => {
  beforeEach(() => {
    clearPersistedOffice()
    setActivePinia(createPinia())
  })

  it('returns null when adding beyond 12 bots', () => {
    const store = useOfficeStore()
    store.reloadFromDefaults(1_000)
    for (const bot of [...store.botList]) {
      store.removeBot(bot.id)
    }
    for (let index = 0; index < 12; index++) {
      const id = store.addBot({ name: `Bot ${index}`, avatar: 'default' })
      expect(id).not.toBeNull()
    }
    expect(store.addBot({ name: 'Overflow', avatar: 'default' })).toBeNull()
    expect(store.botList).toHaveLength(12)
    expect(store.freeSeats).toHaveLength(0)
  })

  it('persists bots and theme to localStorage', () => {
    const store = useOfficeStore()
    store.reloadFromDefaults(1_000)
    store.setTheme('pixel')
    store.addBot({ name: '持久化測試', avatar: 'default' })

    const snapshot = readPersistedOffice()
    expect(snapshot?.themeId).toBe('pixel')
    expect(Object.values(snapshot?.bots ?? {}).some((bot) => bot.name === '持久化測試')).toBe(true)
  })

  it('falls back to defaults when persisted JSON is invalid', () => {
    localStorage.setItem('ai-virtual-office.v1', '{not-json')
    setActivePinia(createPinia())
    const store = useOfficeStore()
    expect(store.themeId).toBe('cozy')
    expect(store.botList).toHaveLength(5)
  })

  it('falls back to defaults when persisted bot records are invalid', () => {
    clearPersistedOffice()
    localStorage.setItem(
      'ai-virtual-office.v1',
      JSON.stringify({ themeId: 'cozy', bots: { broken: { id: 'x' } } }),
    )
    setActivePinia(createPinia())
    const store = useOfficeStore()
    expect(store.themeId).toBe('cozy')
    expect(store.botList).toHaveLength(5)
    expect(store.botList.every((bot) => bot.history.length > 0)).toBe(true)
  })

  it('clears selection when removing selected bot', () => {
    const store = useOfficeStore()
    store.reloadFromDefaults(1_000)
    const target = store.botList[0]!
    store.selectBot(target.id)
    store.removeBot(target.id)
    expect(store.selectedBot).toBeNull()
  })
})
