import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import Aura from '@primeuix/themes/aura'

import App from '../src/App.vue'
import BotDetailDrawer from '../src/components/BotDetailDrawer.vue'
import OfficeScene from '../src/components/OfficeScene.vue'
import { applyThemeCssVars } from '../src/composables/useThemeCssVars'
import { useOfficeStore } from '../src/stores/office'

function mountWithOfficePlugins(component: typeof App, options = {}) {
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

function mountOfficeScene() {
  const pinia = createPinia()
  setActivePinia(pinia)
  applyThemeCssVars('cozy')
  const store = useOfficeStore()
  store.reloadFromDefaults(1_000)
  return {
    store,
    wrapper: mount(OfficeScene, {
      attachTo: document.body,
      global: {
        plugins: [pinia, [PrimeVue, { theme: { preset: Aura } }]],
      },
    }),
  }
}

/** HTML overlay aligned to visible art — same target as a real click on the avatar. */
function clickVisibleCharacter(
  wrapper: ReturnType<typeof mountOfficeScene>['wrapper'],
  botId: string,
) {
  return wrapper.find(`[data-bot-id="${botId}"][data-bot-interactive]`).trigger('click')
}

describe('bot detail interaction', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    setActivePinia(createPinia())
  })

  it('places HTML hit targets above SVG art', () => {
    const { wrapper } = mountOfficeScene()
    const svg = wrapper.find('.office-scene')
    const hitLayer = wrapper.find('.office-scene__hit-layer')
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(hitLayer.exists()).toBe(true)
    expect(wrapper.findAll('[data-bot-interactive]').length).toBeGreaterThan(0)
  })

  it('does not open detail when dispatching click only to SVG head circle', async () => {
    const { wrapper, store } = mountOfficeScene()
    await wrapper.find('.bot-character__body-group circle').trigger('click')
    expect(store.selectedBotId).toBeNull()
  })

  it('opens detail when activating the overlay aligned with visible character', async () => {
    const { wrapper, store } = mountOfficeScene()
    const target = store.botList[0]!
    await clickVisibleCharacter(wrapper, target.id)
    expect(store.selectedBotId).toBe(target.id)
  })

  it('opens detail from full app via character overlay click', async () => {
    const wrapper = mountWithOfficePlugins(App)
    const store = useOfficeStore()
    store.reloadFromDefaults(1_000)
    await flushPromises()

    const target = store.botList[0]!
    await wrapper
      .find(`[data-bot-id="${target.id}"][data-bot-interactive]`)
      .trigger('click')
    await flushPromises()
    expect(store.selectedBotId).toBe(target.id)
  })

  it('shows tooltip when hovering the character overlay', async () => {
    const { wrapper, store } = mountOfficeScene()
    const bot = store.botList[0]!
    await wrapper.find(`[data-bot-id="${bot.id}"][data-bot-interactive]`).trigger('mouseenter')
    await flushPromises()

    const tooltip = document.querySelector('.p-tooltip')
    expect(tooltip).toBeTruthy()
    expect(tooltip?.textContent).toContain(bot.name)
  })

  it('shows tooltip when character overlay is focused', async () => {
    const { wrapper, store } = mountOfficeScene()
    const bot = store.botList[0]!
    await wrapper.find(`[data-bot-id="${bot.id}"][data-bot-interactive]`).trigger('focus')
    await flushPromises()

    expect(document.querySelector('.p-tooltip')).toBeTruthy()
    expect(document.querySelector('.p-tooltip')?.textContent).toContain(bot.name)
  })

  it('opens detail on Enter key on character overlay', async () => {
    const { wrapper, store } = mountOfficeScene()
    const bot = store.botList[0]!
    await wrapper
      .find(`[data-bot-id="${bot.id}"][data-bot-interactive]`)
      .trigger('keydown', { key: 'Enter' })
    expect(store.selectedBotId).toBe(bot.id)
  })

  it('returns focus to bot after drawer after-hide', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    applyThemeCssVars('cozy')
    const store = useOfficeStore()
    store.reloadFromDefaults(1_000)
    const target = store.botList[0]!

    const scene = mount(OfficeScene, {
      attachTo: document.body,
      global: {
        plugins: [pinia, [PrimeVue, { theme: { preset: Aura } }]],
      },
    })

    mount(BotDetailDrawer, {
      global: {
        plugins: [
          pinia,
          ConfirmationService,
          [PrimeVue, { theme: { preset: Aura } }],
        ],
        stubs: {
          Drawer: {
            name: 'Drawer',
            template: '<div class="drawer-stub"><slot /></div>',
            props: ['visible'],
          },
        },
      },
    })

    store.selectBot(target.id)
    store.selectBot(null)
    await vi.waitFor(
      () =>
        document.activeElement ===
        scene.find(`[data-bot-id="${target.id}"][data-bot-interactive]`).element,
      { timeout: 800 },
    )
  })

  it('removes bot from scene after store removal', async () => {
    const wrapper = mountWithOfficePlugins(App)
    const store = useOfficeStore()
    store.reloadFromDefaults(1_000)
    await flushPromises()

    const target = store.botList[0]!
    const before = wrapper.findAll('[data-bot-interactive]').length
    store.removeBot(target.id)
    await flushPromises()

    expect(wrapper.findAll('[data-bot-interactive]')).toHaveLength(before - 1)
  })
})

describe('add bot when seats full', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }),
    })
  })

  it('shows one no-seat toast when opening the add dialog at capacity', async () => {
    document.body.innerHTML = ''
    const wrapper = mountWithOfficePlugins(App)
    const store = useOfficeStore()
    store.reloadFromDefaults(1_000)
    for (const bot of [...store.botList]) {
      store.removeBot(bot.id)
    }
    for (let index = 0; index < 12; index++) {
      store.addBot({ name: `Bot ${index}`, avatar: 'default' })
    }
    await flushPromises()

    const addButton = wrapper
      .findAll('button')
      .find((node) => node.text().includes('新增 bot'))
    expect(addButton).toBeTruthy()
    await addButton!.trigger('click')
    await flushPromises()

    const toastMessages = document.querySelectorAll('.p-toast-message')
    expect(toastMessages).toHaveLength(1)
    expect(toastMessages[0]?.textContent).toContain('無空位')
  })
})
