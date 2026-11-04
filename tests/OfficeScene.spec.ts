import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'

import OfficeScene from '../src/components/OfficeScene.vue'
import { applyThemeCssVars } from '../src/composables/useThemeCssVars'
import { useOfficeStore } from '../src/stores/office'
import { asBotId, asSeatId } from '../src/types/bot'

function mountOfficeScene() {
  const pinia = createPinia()
  setActivePinia(pinia)
  applyThemeCssVars('cozy')
  const store = useOfficeStore()
  store.reloadFromDefaults(1_700_000_000_000)
  return {
    wrapper: mount(OfficeScene, {
      global: {
        plugins: [pinia, [PrimeVue, { theme: { preset: Aura } }]],
      },
    }),
    store,
  }
}

describe('OfficeScene', () => {
  it('renders one character per bot in the store', () => {
    const { wrapper, store } = mountOfficeScene()
    expect(wrapper.findAll('.bot-character[data-bot-id]')).toHaveLength(store.botList.length)
  })

  it('applies data-bot-status when bot status changes', async () => {
    const { wrapper, store } = mountOfficeScene()
    const target = store.botList[0]!
    expect(wrapper.find(`.bot-character[data-bot-id="${target.id}"]`).attributes('data-bot-status')).toBe(
      target.status.kind,
    )

    store.setStatus(target.id, { kind: 'waiting', since: Date.now(), waitingFor: 'user' })
    await wrapper.vm.$nextTick()

    expect(wrapper.find(`.bot-character[data-bot-id="${target.id}"]`).attributes('data-bot-status')).toBe('waiting')
  })

  it('reflects distinct bots from seeded defaults', () => {
    const { wrapper } = mountOfficeScene()
    const ids = wrapper
      .findAll('.bot-character[data-bot-id]')
      .map((node) => node.attributes('data-bot-id'))
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.length).toBeGreaterThanOrEqual(5)
  })

  it('updates status attribute for a specific bot id', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    applyThemeCssVars('cozy')
    const store = useOfficeStore()
    store.replaceState({
      bots: {
        [asBotId('solo')]: {
          id: asBotId('solo'),
          name: 'Solo',
          avatar: 'default',
          seatId: asSeatId('seat-1'),
          status: { kind: 'working', since: 0 },
          task: null,
          history: [],
        },
      },
      selectedBotId: null,
      themeId: 'cozy',
      simulationRunning: false,
    })

    const wrapper = mount(OfficeScene, {
      global: {
        plugins: [pinia, [PrimeVue, { theme: { preset: Aura } }]],
      },
    })

    expect(wrapper.find('.bot-character[data-bot-id="solo"]').attributes('data-bot-status')).toBe('working')
    store.setStatus(asBotId('solo'), { kind: 'error', since: 1, message: 'test' })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.bot-character[data-bot-id="solo"]').attributes('data-bot-status')).toBe('error')
  })
})
