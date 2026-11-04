import { computed, onUnmounted, ref, watch, type Ref } from 'vue'
import { MESSAGING_TRAVEL_MS } from '../simulation/rules'
import type { Bot, BotId } from '../types/bot'
import type { OfficeLayout, Point, Seat } from '../types/theme'

export function seatCharacterAnchor(seat: Seat): Point {
  return { x: seat.pos.x + 45, y: seat.pos.y - 16 }
}

export function resolveBotPosition(
  bot: Bot,
  botsById: Record<BotId, Bot>,
  layout: OfficeLayout,
  now: number,
): Point {
  const seat = layout.seats.find((entry) => entry.id === bot.seatId)
  if (!seat) return { x: 0, y: 0 }
  const home = seatCharacterAnchor(seat)

  if (bot.status.kind === 'idle' && bot.status.activity === 'coffee') {
    return layout.coffeeSpot
  }

  if (bot.status.kind === 'messaging') {
    const target = botsById[bot.status.targetBotId]
    const targetSeat = target ? layout.seats.find((entry) => entry.id === target.seatId) : undefined
    const end = targetSeat ? seatCharacterAnchor(targetSeat) : home
    const progress = Math.min(1, (now - bot.status.since) / MESSAGING_TRAVEL_MS)
    return {
      x: home.x + (end.x - home.x) * progress,
      y: home.y + (end.y - home.y) * progress,
    }
  }

  return home
}

export function useMotionClock(active: Ref<boolean>) {
  const now = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | null = null

  const stop = () => {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  watch(
    active,
    (running) => {
      stop()
      if (!running) return
      now.value = Date.now()
      timer = setInterval(() => {
        now.value = Date.now()
      }, 100)
    },
    { immediate: true },
  )

  onUnmounted(stop)

  return now
}

export function useBotPosition(
  bot: Ref<Bot>,
  botsById: Ref<Record<BotId, Bot>>,
  layout: Ref<OfficeLayout>,
  now: Ref<number>,
) {
  return computed(() =>
    resolveBotPosition(bot.value, botsById.value, layout.value, now.value),
  )
}
