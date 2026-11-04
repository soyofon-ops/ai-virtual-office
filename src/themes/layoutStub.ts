import { asSeatId, type SeatId } from '../types/bot'
import type { OfficeLayout } from '../types/theme'

function seat(id: string, x: number, y: number): { id: SeatId; pos: { x: number; y: number }; facing: 'down' } {
  return { id: asSeatId(id), pos: { x, y }, facing: 'down' }
}

export const stubOfficeLayout: OfficeLayout = {
  width: 640,
  height: 330,
  seats: [
    seat('seat-1', 50, 110),
    seat('seat-2', 190, 110),
    seat('seat-3', 330, 110),
    seat('seat-4', 470, 110),
    seat('seat-5', 50, 180),
    seat('seat-6', 190, 180),
    seat('seat-7', 330, 180),
    seat('seat-8', 470, 180),
    seat('seat-9', 50, 250),
    seat('seat-10', 190, 250),
    seat('seat-11', 330, 250),
    seat('seat-12', 470, 250),
  ],
  coffeeSpot: { x: 115, y: 265 },
}
