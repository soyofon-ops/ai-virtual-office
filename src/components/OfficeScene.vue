<script setup lang="ts">
import { computed } from 'vue'

import BotCharacter from './BotCharacter.vue'

import { resolveBotPosition, useMotionClock } from '../composables/useBotMotion'
import { useOfficeStore } from '../stores/office'
import { layoutForTheme } from '../themes/registry'
import type { BotId, SeatId } from '../types/bot'

const store = useOfficeStore()

const layout = computed(() => layoutForTheme(store.themeId))

const bots = computed(() => store.botList)

const motionActive = computed(
  () => store.simulationRunning || bots.value.some((bot) => bot.status.kind === 'messaging'),
)

const motionNow = useMotionClock(motionActive)

const renderedBots = computed(() => {
  const layoutValue = layout.value
  const now = motionNow.value
  const botsById = store.bots
  return bots.value.map((bot) => ({
    bot,
    position: resolveBotPosition(bot, botsById, layoutValue, now),
  }))
})

const occupiedSeats = computed(() => new Set(bots.value.map((bot) => bot.seatId)))

function seatLabel(seatId: SeatId) {
  if (occupiedSeats.value.has(seatId)) return ''
  return '空位'
}

function onBotActivate(id: BotId) {
  store.selectBot(id)
}
</script>

<template>
  <svg
    class="office-scene"
    :viewBox="`0 0 ${layout.width} ${layout.height}`"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="虛擬辦公室場景"
  >
    <rect class="office-scene__floor" x="4" y="4" :width="layout.width - 8" :height="layout.height - 8" rx="10" />

    <rect class="office-scene__coffee-zone" x="60" y="230" width="110" height="60" rx="6" />
    <text x="115" y="265" text-anchor="middle" class="office-scene__coffee-label">咖啡區（閒置）</text>

    <g v-for="seat in layout.seats" :key="seat.id">
      <rect
        class="office-scene__desk"
        :x="seat.pos.x"
        :y="seat.pos.y"
        width="90"
        height="34"
        rx="6"
      />
      <text
        v-if="seatLabel(seat.id)"
        :x="seat.pos.x + 45"
        :y="seat.pos.y + 22"
        text-anchor="middle"
        class="office-scene__seat-label"
      >
        {{ seatLabel(seat.id) }}
      </text>
    </g>

    <BotCharacter
      v-for="entry in renderedBots"
      :key="entry.bot.id"
      :bot="entry.bot"
      :position="entry.position"
      @activate="onBotActivate"
    />
  </svg>
</template>

<style scoped>
.office-scene {
  display: block;
  width: 100%;
  max-width: 960px;
  height: auto;
  border: 1px solid rgb(0 0 0 / 8%);
  border-radius: 12px;
  background: var(--office-wall);
}

.office-scene__floor {
  fill: var(--office-floor);
  stroke: rgb(0 0 0 / 12%);
}

.office-scene__desk {
  fill: var(--office-desk);
  stroke: rgb(0 0 0 / 15%);
}

.office-scene__coffee-zone {
  fill: none;
  stroke: rgb(0 0 0 / 20%);
  stroke-dasharray: 4 3;
}

.office-scene__coffee-label,
.office-scene__seat-label {
  font-size: 11px;
  fill: rgb(0 0 0 / 45%);
  pointer-events: none;
}
</style>
