import { defineStore } from 'pinia'
import { createSimulationEngine } from '../simulation/engine'
import { createRandomSource } from '../simulation/random'
import { defaultSimulationConfig } from '../simulation/rules'
import { layoutForTheme, themeRegistry } from '../themes/registry'
import {
  asBotId,
  asSeatId,
  createBotId,
  MAX_BOT_HISTORY,
  MAX_BOTS,
  type Bot,
  type BotEvent,
  type BotId,
  type BotStatus,
  type BotStatusKind,
  type SeatId,
  type Task,
} from '../types/bot'
import type { ThemeId } from '../types/theme'
import { createDefaultBots, suggestBotName } from '../simulation/fakeData'

const STORAGE_KEY = 'ai-virtual-office.v1'

export interface PersistedOfficeSnapshot {
  bots: Record<string, Bot>
  themeId: ThemeId
}

function isBotStatusKind(value: unknown): value is BotStatusKind {
  return (
    value === 'working' ||
    value === 'idle' ||
    value === 'messaging' ||
    value === 'waiting' ||
    value === 'error'
  )
}

function isBotStatus(value: unknown): value is BotStatus {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  if (!isBotStatusKind(record.kind) || typeof record.since !== 'number') return false
  switch (record.kind) {
    case 'idle':
      return record.activity === 'daydream' || record.activity === 'coffee'
    case 'messaging':
      return typeof record.targetBotId === 'string'
    case 'waiting':
      return typeof record.waitingFor === 'string'
    case 'error':
      return typeof record.message === 'string'
    case 'working':
      return true
    default:
      return false
  }
}

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.id === 'string' &&
    typeof record.title === 'string' &&
    typeof record.progress === 'number' &&
    typeof record.startedAt === 'number'
  )
}

function isBotEvent(value: unknown): value is BotEvent {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.at === 'number' &&
    isBotStatusKind(record.status) &&
    typeof record.note === 'string'
  )
}

function isBot(value: unknown): value is Bot {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  if (
    typeof record.id !== 'string' ||
    typeof record.name !== 'string' ||
    typeof record.avatar !== 'string' ||
    typeof record.seatId !== 'string' ||
    !isBotStatus(record.status) ||
    !Array.isArray(record.history)
  ) {
    return false
  }
  if (record.task !== null && !isTask(record.task)) return false
  return record.history.every(isBotEvent)
}

function parsePersistedSnapshot(raw: unknown): PersistedOfficeSnapshot | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  if (typeof record.themeId !== 'string') return null
  if (!record.bots || typeof record.bots !== 'object') return null
  const bots: Record<string, Bot> = {}
  for (const [key, bot] of Object.entries(record.bots as Record<string, unknown>)) {
    if (!isBot(bot)) return null
    bots[key] = {
      ...bot,
      id: asBotId(bot.id),
      seatId: asSeatId(bot.seatId),
    }
  }
  if (Object.keys(bots).length > MAX_BOTS) return null
  return { bots, themeId: record.themeId }
}

export function readPersistedOffice(): PersistedOfficeSnapshot | null {
  if (typeof localStorage === 'undefined') return null
  const rawText = localStorage.getItem(STORAGE_KEY)
  if (!rawText) return null
  try {
    return parsePersistedSnapshot(JSON.parse(rawText))
  } catch {
    return null
  }
}

export function writePersistedOffice(snapshot: PersistedOfficeSnapshot) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
}

export function clearPersistedOffice() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

function initialBots(now: number): Record<BotId, Bot> {
  const persisted = readPersistedOffice()
  if (persisted) return persisted.bots as Record<BotId, Bot>
  return createDefaultBots(now) as Record<BotId, Bot>
}

function initialThemeId(): ThemeId {
  const persisted = readPersistedOffice()
  if (persisted && themeRegistry.get(persisted.themeId)) return persisted.themeId
  return themeRegistry.defaultId
}

function appendEvent(bot: Bot, event: BotEvent) {
  bot.history = [...bot.history, event].slice(-MAX_BOT_HISTORY)
}

function occupiedSeatIds(bots: Record<BotId, Bot>): Set<SeatId> {
  return new Set(Object.values(bots).map((bot) => bot.seatId))
}

function firstFreeSeat(themeId: ThemeId, bots: Record<BotId, Bot>, preferred?: SeatId): SeatId | null {
  const layout = layoutForTheme(themeId)
  const occupied = occupiedSeatIds(bots)
  if (preferred && layout.seats.some((seat) => seat.id === preferred) && !occupied.has(preferred)) {
    return preferred
  }
  const free = layout.seats.find((seat) => !occupied.has(seat.id))
  return free?.id ?? null
}

export function createInitialOfficeState(now = Date.now()) {
  return {
    bots: initialBots(now),
    selectedBotId: null as BotId | null,
    themeId: initialThemeId(),
    simulationRunning: false,
  }
}

export type OfficeState = ReturnType<typeof createInitialOfficeState>

export function createOfficeActions(state: OfficeState, persist: () => void) {
  function persistBotsAndTheme() {
    writePersistedOffice({ bots: state.bots, themeId: state.themeId })
    persist()
  }

  return {
    addBot(input: { name: string; avatar: string; seatId?: SeatId }, roll: () => number = Math.random) {
      if (Object.keys(state.bots).length >= MAX_BOTS) return null
      const seatId = firstFreeSeat(state.themeId, state.bots, input.seatId)
      if (!seatId) return null
      const trimmedName = input.name.trim()
      const existingNames = new Set(Object.values(state.bots).map((bot) => bot.name))
      const name = trimmedName || suggestBotName(existingNames, roll)
      const id = createBotId()
      const now = Date.now()
      const bot: Bot = {
        id,
        name,
        avatar: input.avatar,
        seatId,
        status: { kind: 'idle', since: now, activity: 'daydream' },
        task: null,
        history: [{ at: now, status: 'idle', note: '加入辦公室' }],
      }
      state.bots[id] = bot
      persistBotsAndTheme()
      return id
    },
    removeBot(id: BotId) {
      if (!state.bots[id]) return
      delete state.bots[id]
      if (state.selectedBotId === id) state.selectedBotId = null
      persistBotsAndTheme()
    },
    selectBot(id: BotId | null) {
      state.selectedBotId = id
    },
    setTheme(id: ThemeId) {
      if (!themeRegistry.get(id)) return
      state.themeId = id
      persistBotsAndTheme()
    },
    setStatus(id: BotId, status: BotStatus) {
      const bot = state.bots[id]
      if (!bot) return
      bot.status = status
    },
    applySimulationUpdate(
      id: BotId,
      update: { status: BotStatus; task: Task | null; eventNote: string },
    ) {
      const bot = state.bots[id]
      if (!bot) return
      const previousKind = bot.status.kind
      bot.status = update.status
      bot.task = update.task
      appendEvent(bot, {
        at: update.status.since,
        status: update.status.kind,
        note: update.eventNote,
      })
      if (previousKind !== update.status.kind) {
        persistBotsAndTheme()
      }
    },
    toggleSimulation() {
      state.simulationRunning = !state.simulationRunning
    },
  }
}

export function createOfficeGetters(state: OfficeState) {
  return {
    freeSeats() {
      const layout = layoutForTheme(state.themeId)
      const occupied = occupiedSeatIds(state.bots)
      return layout.seats.filter((seat) => !occupied.has(seat.id))
    },
    countsByStatus(): Record<BotStatusKind, number> {
      const counts: Record<BotStatusKind, number> = {
        working: 0,
        idle: 0,
        messaging: 0,
        waiting: 0,
        error: 0,
      }
      for (const bot of Object.values(state.bots)) {
        counts[bot.status.kind] += 1
      }
      return counts
    },
    selectedBot(): Bot | null {
      if (!state.selectedBotId) return null
      return state.bots[state.selectedBotId] ?? null
    },
    botList(): Bot[] {
      return Object.values(state.bots)
    },
  }
}

function officeActions(state: OfficeState) {
  return createOfficeActions(state, () => undefined)
}

export const useOfficeStore = defineStore('office', {
  state: (): OfficeState => createInitialOfficeState(),
  getters: {
    freeSeats: (state) => createOfficeGetters(state).freeSeats(),
    countsByStatus: (state) => createOfficeGetters(state).countsByStatus(),
    selectedBot: (state) => createOfficeGetters(state).selectedBot(),
    botList: (state) => createOfficeGetters(state).botList(),
  },
  actions: {
    addBot(input: { name: string; avatar: string; seatId?: SeatId }) {
      return officeActions(this.$state).addBot(input)
    },
    removeBot(id: BotId) {
      officeActions(this.$state).removeBot(id)
    },
    selectBot(id: BotId | null) {
      officeActions(this.$state).selectBot(id)
    },
    setTheme(id: ThemeId) {
      officeActions(this.$state).setTheme(id)
    },
    setStatus(id: BotId, status: BotStatus) {
      officeActions(this.$state).setStatus(id, status)
    },
    applySimulationUpdate(
      id: BotId,
      update: { status: BotStatus; task: Task | null; eventNote: string },
    ) {
      officeActions(this.$state).applySimulationUpdate(id, update)
    },
    toggleSimulation() {
      officeActions(this.$state).toggleSimulation()
    },
    replaceState(next: OfficeState) {
      this.$state.bots = next.bots
      this.$state.selectedBotId = next.selectedBotId
      this.$state.themeId = next.themeId
      this.$state.simulationRunning = next.simulationRunning
    },
    reloadFromDefaults(now = Date.now()) {
      clearPersistedOffice()
      this.replaceState(createInitialOfficeState(now))
    },
    createSimulationEngine(options?: { seed?: number; now?: () => number }) {
      const config =
        options?.seed !== undefined
          ? { ...defaultSimulationConfig, seed: options.seed }
          : defaultSimulationConfig
      return createSimulationEngine({
        store: {
          listBotIds: () => Object.keys(this.bots) as BotId[],
          getBot: (id) => {
            const bot = this.bots[id]
            if (!bot) return null
            return { status: bot.status, task: bot.task }
          },
          applySimulationUpdate: (id, update) => this.applySimulationUpdate(id, update),
        },
        config,
        random: options?.seed !== undefined ? createRandomSource(options.seed) : undefined,
        now: options?.now,
      })
    },
  },
})
