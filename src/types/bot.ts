export type BotId = string & { readonly __brand: 'BotId' }
export type SeatId = string & { readonly __brand: 'SeatId' }

export type BotStatusKind = 'working' | 'idle' | 'messaging' | 'waiting' | 'error'

export type BotStatus =
  | { kind: 'working'; since: number }
  | { kind: 'idle'; since: number; activity: 'daydream' | 'coffee' }
  | { kind: 'messaging'; since: number; targetBotId: BotId }
  | { kind: 'waiting'; since: number; waitingFor: BotId | 'user' }
  | { kind: 'error'; since: number; message: string }

export interface Task {
  id: string
  title: string
  progress: number
  startedAt: number
}

export interface BotEvent {
  at: number
  status: BotStatusKind
  note: string
}

export interface Bot {
  id: BotId
  name: string
  avatar: string
  seatId: SeatId
  status: BotStatus
  task: Task | null
  history: BotEvent[]
}

export const MAX_BOT_HISTORY = 20
export const MAX_BOTS = 12

export function asBotId(value: string): BotId {
  return value as BotId
}

export function asSeatId(value: string): SeatId {
  return value as SeatId
}

export function createBotId(): BotId {
  return asBotId(crypto.randomUUID())
}
