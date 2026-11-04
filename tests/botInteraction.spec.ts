import { beforeEach, describe, expect, it } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import Aura from '@primeuix/themes/aura'

import App from '../src/App.vue'
import BotCharacter from '../src/components/BotCharacter.vue'
import { applyThemeCssVars } from '../src/composables/useThemeCssVars'
import { useOfficeStore } from '../src/stores/office'
import { asBotId, asSeatId } from '../src/types/bot'

function mountWithOfficePlugins(component: typeof App | typeof BotCharacter, options = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  applyThemeCssVars('cozy')
  return mount(component, {
    ...options,
    global: {
      plugins: [
        pinia,
        ConfirmationService,
        ToastService,
        [PrimeVue, { theme: { preset: Aura } }],
      ],
      ...(options as { global?: object }).global,
    },
  })
}

describe('bot detail interaction', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('selects bot when character is clicked', async () => {
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
          history: [{ at: 0, status: 'working', note: 'test' }],
        },
      },
      selectedBotId: null,
      themeId: 'cozy',
      simulationRunning: false,
    })

    const wrapper = mount(BotCharacter, {
      props: {
        bot: store.botList[0]!,
        position: { x: 10, y: 10 },
      },
      global: {
        plugins: [pinia, [PrimeVue, { theme: { preset: Aura } }]],
      },
    })

    await wrapper.find('.bot-character__hit').trigger('click')
    expect(wrapper.emitted('activate')?.[0]).toEqual([asBotId('solo')])
  })

  it('emits activate on Enter key', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useOfficeStore()
    store.reloadFromDefaults(1_000)
    const bot = store.botList[0]!

    const wrapper = mount(BotCharacter, {
      props: { bot, position: { x: 0, y: 0 } },
      global: {
        plugins: [pinia, [PrimeVue, { theme: { preset: Aura } }]],
      },
    })

    await wrapper.find('.bot-character__hit').trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('activate')?.[0]).toEqual([bot.id])
  })

  it('opens detail drawer after scene click', async () => {
    const wrapper = mountWithOfficePlugins(App)
    const store = useOfficeStore()
    store.reloadFromDefaults(1_000)
    await flushPromises()

    const target = store.botList[0]!
    await wrapper.find(`[data-bot-id="${target.id}"] .bot-character__hit`).trigger('click')
    await flushPromises()

    expect(store.selectedBotId).toBe(target.id)
    expect(store.selectedBot?.name).toBe(target.name)
  })

  it('removes bot from scene after store removal', async () => {
    const wrapper = mountWithOfficePlugins(App)
    const store = useOfficeStore()
    store.reloadFromDefaults(1_000)
    await flushPromises()

    const target = store.botList[0]!
    const before = wrapper.findAll('[data-bot-id]').length
    store.removeBot(target.id)
    await flushPromises()

    expect(wrapper.findAll('[data-bot-id]')).toHaveLength(before - 1)
    expect(wrapper.find(`[data-bot-id="${target.id}"]`).exists()).toBe(false)
  })
})
