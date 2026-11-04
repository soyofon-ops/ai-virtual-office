import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createSimulationEngine } from '../src/simulation/engine'
import { defaultSimulationConfig } from '../src/simulation/rules'
import { clearPersistedOffice, useOfficeStore } from '../src/stores/office'
import { asBotId } from '../src/types/bot'

describe('simulation engine', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    clearPersistedOffice()
    setActivePinia(createPinia())
  })

  it('auto-recovers error to idle after minimum dwell', () => {
    let now = 10_000
    const store = useOfficeStore()
    store.reloadFromDefaults(now)
    const botId = asBotId('seed-c')
    store.setStatus(botId, { kind: 'error', since: now, message: '連線逾時' })

    const engine = store.createSimulationEngine({ seed: 42, now: () => now })
    engine.step(now + defaultSimulationConfig.minDwellMs.error)
    expect(store.bots[botId]?.status.kind).toBe('idle')
    engine.stop()
  })

  it('transitions idle to working when random roll hits idle weight', () => {
    let now = 20_000
    const store = useOfficeStore()
    store.reloadFromDefaults(now)
    for (const bot of store.botList) {
      store.removeBot(bot.id)
    }
    const loneId = store.addBot({ name: 'Lonely', avatar: 'default' })!
    store.setStatus(loneId, { kind: 'idle', since: now - 5_000, activity: 'daydream' })

    const toWorking = createSimulationEngine({
      store: {
        listBotIds: () => [loneId],
        getBot: (id) => {
          const bot = store.bots[id]
          return bot ? { status: bot.status, task: bot.task } : null
        },
        applySimulationUpdate: (id, update) => store.applySimulationUpdate(id, update),
      },
      config: defaultSimulationConfig,
      random: { next: () => 0.1 },
      now: () => now,
    })

    toWorking.step(now)
    expect(store.bots[loneId]?.status.kind).toBe('working')
  })

  it('keeps idle when random roll is above working weight', () => {
    let now = 20_000
    const store = useOfficeStore()
    store.reloadFromDefaults(now)
    for (const bot of store.botList) {
      store.removeBot(bot.id)
    }
    const loneId = store.addBot({ name: 'Lonely', avatar: 'default' })!
    store.setStatus(loneId, { kind: 'idle', since: now - 5_000, activity: 'daydream' })

    const stayIdle = createSimulationEngine({
      store: {
        listBotIds: () => [loneId],
        getBot: (id) => {
          const bot = store.bots[id]
          return bot ? { status: bot.status, task: bot.task } : null
        },
        applySimulationUpdate: (id, update) => store.applySimulationUpdate(id, update),
      },
      config: defaultSimulationConfig,
      random: { next: () => 0.85 },
      now: () => now,
    })

    stayIdle.step(now)
    expect(store.bots[loneId]?.status.kind).toBe('idle')
  })

  it('turns waiting into error after 20 seconds', () => {
    let now = 50_000
    const store = useOfficeStore()
    store.reloadFromDefaults(now)
    const botId = asBotId('seed-b')
    store.setStatus(botId, { kind: 'waiting', since: now - 20_000, waitingFor: 'user' })

    const engine = store.createSimulationEngine({ seed: 7, now: () => now })
    engine.step(now)
    expect(store.bots[botId]?.status.kind).toBe('error')
    engine.stop()
  })

  it('start and stop interval ticks', () => {
    let now = 0
    const store = useOfficeStore()
    store.reloadFromDefaults(now)
    const engine = store.createSimulationEngine({ seed: 1, now: () => now })
    engine.start()
    expect(engine.running).toBe(true)
    now += 1000
    vi.advanceTimersByTime(1000)
    engine.stop()
    expect(engine.running).toBe(false)
  })
})
