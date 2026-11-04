import type { SeatId } from './bot'

export type ThemeId = string

export interface Point {
  x: number
  y: number
}

export interface Seat {
  id: SeatId
  pos: Point
  facing: 'up' | 'down' | 'left' | 'right'
}

export interface OfficeLayout {
  width: number
  height: number
  seats: Seat[]
  coffeeSpot: Point
  walkways?: Point[]
}

export interface ThemeTokens {
  floor: string
  wall: string
  desk: string
  bubbleQuestion: string
  bubbleError: string
  font: string
}

export interface Theme {
  id: ThemeId
  label: string
  primevuePreset: unknown
  tokens: ThemeTokens
  layout: OfficeLayout
  avatars: Record<string, { sprite: string; size: number }>
  props?: { id: string; asset: string; pos: Point }[]
}

export interface ThemeRegistry {
  register(theme: Theme): void
  get(id: ThemeId): Theme | undefined
  list(): readonly Theme[]
  readonly defaultId: ThemeId
}
