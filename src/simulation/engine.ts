import type { BotId, BotStatus } from '../types/bot'
import type { SimulationConfig } from '../types/simulation'
import { createTask, ERROR_MESSAGE_POOL, idleActivity, pickRandom } from './fakeData'
import { createRandomSource, type RandomSource } from './random'
import {
  defaultSimulationConfig,
  dwellElapsed,
  MESSAGING_TRAVEL_MS,
  WAITING_TIMEOUT_MS,
  weightedPick,
  WORKING_PROGRESS_PER_TICK,
} from './rules'

export interface SimulationStoreBridge {
  listBotIds(): BotId[]
  getBot(id: BotId): {
    status: BotStatus
    task: { progress: number; title: string; id: string; startedAt: number } | null
  } | null
  applySimulationUpdate(
    id: BotId,
    update: {
      status: BotStatus
      task: import('../types/bot').Task | null
      eventNote: string
    },
  ): void
}

type TransitionListener = (id: BotId, from: BotStatus, to: BotStatus) => void

export interface CreateSimulationEngineOptions {
  store: SimulationStoreBridge
  config?: SimulationConfig
  random?: RandomSource
  now?: () => number
}

export function createSimulationEngine(options: CreateSimulationEngineOptions) {
  const config = options.config ?? defaultSimulationConfig
  const random = options.random ?? createRandomSource(config.seed)
  const nowFn = options.now ?? (() => Date.now())
  let timer: ReturnType<typeof setInterval> | null = null
  let running = false
  const listeners = new Set<TransitionListener>()

  function otherBotIds(self: BotId): BotId[] {
    return options.store.listBotIds().filter((id) => id !== self)
  }

  function pickTarget(self: BotId): BotId | null {
    const others = otherBotIds(self)
    if (others.length === 0) return null
    return pickRandom(others, () => random.next())
  }

  function emitTransition(id: BotId, from: BotStatus, to: BotStatus) {
    if (from.kind === to.kind && from.since === to.since) return
    for (const listener of listeners) listener(id, from, to)
  }

  function commit(id: BotId, from: BotStatus, status: BotStatus, task: import('../types/bot').Task | null, eventNote: string) {
    options.store.applySimulationUpdate(id, { status, task, eventNote })
    emitTransition(id, from, status)
  }

  function step(now: number) {
    for (const id of options.store.listBotIds()) {
      const bot = options.store.getBot(id)
      if (!bot) continue
      const from = bot.status
      const status = from

      if (status.kind === 'working') {
        const task = bot.task ?? createTask(now, () => random.next())
        const nextProgress = Math.min(1, task.progress + WORKING_PROGRESS_PER_TICK)
        const updatedTask = { ...task, progress: nextProgress }
        if (nextProgress >= 1 && dwellElapsed(now, status.since, 'working', config)) {
          commit(id, from, { kind: 'idle', since: now, activity: idleActivity(() => random.next()) }, null, '任務完成')
          continue
        }
        if (!dwellElapsed(now, status.since, 'working', config)) {
          options.store.applySimulationUpdate(id, {
            status,
            task: updatedTask,
            eventNote: '任務進行中',
          })
          continue
        }
        const nextKind = weightedPick(config.transitionWeights.working, () => random.next())
        if (nextKind === 'messaging') {
          const target = pickTarget(id)
          if (!target) {
            commit(id, from, { kind: 'idle', since: now, activity: idleActivity(() => random.next()) }, null, '無同事可傳訊')
            continue
          }
          commit(
            id,
            from,
            { kind: 'messaging', since: now, targetBotId: target },
            updatedTask,
            '前往傳訊息',
          )
          continue
        }
        if (nextKind === 'error') {
          commit(
            id,
            from,
            { kind: 'error', since: now, message: pickRandom(ERROR_MESSAGE_POOL, () => random.next()) },
            updatedTask,
            '發生錯誤',
          )
          continue
        }
        options.store.applySimulationUpdate(id, { status, task: updatedTask, eventNote: '任務進行中' })
        continue
      }

      if (status.kind === 'idle') {
        if (!dwellElapsed(now, status.since, 'idle', config)) continue
        const nextKind = weightedPick(config.transitionWeights.idle, () => random.next())
        if (nextKind === 'working') {
          commit(id, from, { kind: 'working', since: now }, createTask(now, () => random.next()), '開始新任務')
        }
        continue
      }

      if (status.kind === 'messaging') {
        const travelMs = config.minDwellMs.messaging ?? MESSAGING_TRAVEL_MS
        if (now - status.since >= travelMs) {
          commit(
            id,
            from,
            { kind: 'waiting', since: now, waitingFor: status.targetBotId },
            bot.task,
            '等待回覆',
          )
        }
        continue
      }

      if (status.kind === 'waiting') {
        if (now - status.since >= WAITING_TIMEOUT_MS) {
          commit(
            id,
            from,
            { kind: 'error', since: now, message: pickRandom(ERROR_MESSAGE_POOL, () => random.next()) },
            bot.task,
            '等待逾時',
          )
          continue
        }
        if (!dwellElapsed(now, status.since, 'waiting', config)) continue
        const nextKind = weightedPick(config.transitionWeights.waiting, () => random.next())
        if (nextKind === 'working') {
          const task = bot.task ?? createTask(now, () => random.next())
          commit(id, from, { kind: 'working', since: now }, task, '收到回覆')
        }
        continue
      }

      if (status.kind === 'error') {
        if (dwellElapsed(now, status.since, 'error', config)) {
          commit(id, from, { kind: 'idle', since: now, activity: idleActivity(() => random.next()) }, null, '錯誤已恢復')
        }
      }
    }
  }

  function start() {
    if (running) return
    running = true
    timer = setInterval(() => step(nowFn()), config.tickMs)
  }

  function stop() {
    running = false
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  function onTransition(cb: TransitionListener) {
    listeners.add(cb)
    return () => listeners.delete(cb)
  }

  return {
    start,
    stop,
    get running() {
      return running
    },
    step,
    onTransition,
  }
}

export type OfficeSimulationEngine = ReturnType<typeof createSimulationEngine>
