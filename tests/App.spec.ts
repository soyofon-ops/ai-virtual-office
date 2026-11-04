import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import App from '../src/App.vue'

describe('App', () => {
  it('mounts', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), [PrimeVue, { theme: { preset: Aura } }]],
      },
    })
    expect(wrapper.exists()).toBe(true)
  })
})
