import type { BotId, BotStatus, BotStatusKind } from './bot'

export interface SimulationConfig {
  tickMs: number
  transitionWeights: Record<BotStatusKind, Partial<Record<BotStatusKind, number>>>
  minDwellMs: Record<BotStatusKind, number>
  seed?: number
}

export interface SimulationEngine {
  start(): void
  stop(): void
  readonly running: boolean
  step(now: number): void
  onTransition(cb: (id: BotId, from: BotStatus, to: BotStatus) => void): () => void
}
