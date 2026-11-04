import type { BotStatusKind } from '../types/bot'
import type { SimulationConfig } from '../types/simulation'

export const WAITING_TIMEOUT_MS = 20_000
export const MESSAGING_TRAVEL_MS = 3000
export const WORKING_PROGRESS_PER_TICK = 0.12

export const defaultSimulationConfig: SimulationConfig = {
  tickMs: 1000,
  minDwellMs: {
    working: 5000,
    idle: 4000,
    messaging: MESSAGING_TRAVEL_MS,
    waiting: 3000,
    error: 6000,
  },
  transitionWeights: {
    working: { messaging: 0.2, error: 0.05 },
    idle: { working: 0.6 },
    messaging: {},
    waiting: { working: 0.4 },
    error: {},
  },
}

export function dwellElapsed(now: number, since: number, kind: BotStatusKind, config: SimulationConfig): boolean {
  return now - since >= config.minDwellMs[kind]
}

export function weightedPick(
  weights: Partial<Record<BotStatusKind, number>>,
  roll: () => number,
): BotStatusKind | null {
  const entries = Object.entries(weights).filter(([, w]) => (w ?? 0) > 0) as [BotStatusKind, number][]
  if (entries.length === 0) return null
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  if (total <= 0) return null
  let cursor = roll() * total
  for (const [kind, weight] of entries) {
    cursor -= weight
    if (cursor <= 0) return kind
  }
  return entries[entries.length - 1]![0]
}
