<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'

import BotCharacter from './BotCharacter.vue'

import { resolveBotPosition, useMotionClock } from '../composables/useBotMotion'
import { useOfficeStore } from '../stores/office'
import { layoutForTheme } from '../themes/registry'
import type { Bot, BotId, SeatId } from '../types/bot'
import type { Point } from '../types/theme'
import { botTooltipText } from '../utils/botStatus'
import { clearRestoredFocusRing, rememberBotInteractive } from '../utils/botFocus'

const activeTooltip = ref<{ text: string; x: number; y: number } | null>(null)

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

function onBotActivate(id: BotId, event: Event) {
  rememberBotInteractive(event.currentTarget)
  store.selectBot(id)
}

function onBotKeydown(event: KeyboardEvent, id: BotId) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    rememberBotInteractive(event.currentTarget)
    onBotActivate(id, event)
  }
}

function hitAreaStyle(position: Point) {
  const { width, height } = layout.value
  const left = ((position.x - 22) / width) * 100
  const top = ((position.y - 22) / height) * 100
  const w = (44 / width) * 100
  const h = (58 / height) * 100
  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${w}%`,
    height: `${h}%`,
  }
}

function tooltipFor(bot: Bot) {
  return botTooltipText(bot.name, bot.status)
}

function showTooltipFor(event: FocusEvent | MouseEvent, bot: Bot) {
  const target = event.currentTarget
  if (!(target instanceof HTMLElement)) return
  const rect = target.getBoundingClientRect()
  activeTooltip.value = {
    text: tooltipFor(bot),
    x: rect.left + rect.width / 2,
    y: rect.top,
  }
}

function hideTooltip() {
  activeTooltip.value = null
}

onUnmounted(() => {
  activeTooltip.value = null
})
</script>

<template>
  <div class="office-scene-shell">
    <svg
      class="office-scene"
      :viewBox="`0 0 ${layout.width} ${layout.height}`"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
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
      />
    </svg>

    <div class="office-scene__hit-layer" aria-label="虛擬辦公室場景">
      <button
        v-for="entry in renderedBots"
        :key="`hit-${entry.bot.id}`"
        type="button"
        class="office-scene__bot-hit"
        :data-bot-id="entry.bot.id"
        data-bot-interactive
        :style="hitAreaStyle(entry.position)"
        :aria-label="`${entry.bot.name}，${entry.bot.status.kind}，按 Enter 查看詳情`"
        @mousedown="rememberBotInteractive($event.currentTarget)"
        @click="onBotActivate(entry.bot.id, $event)"
        @keydown="onBotKeydown($event, entry.bot.id)"
        @mouseenter="showTooltipFor($event, entry.bot)"
        @mouseleave="hideTooltip"
        @focus="showTooltipFor($event, entry.bot)"
        @blur="hideTooltip(); clearRestoredFocusRing()"
      />
    </div>

    <Teleport to="body">
      <div
        v-if="activeTooltip"
        class="p-tooltip p-component p-tooltip-top office-scene-tooltip"
        role="tooltip"
        :style="{
          position: 'fixed',
          left: `${activeTooltip.x}px`,
          top: `${activeTooltip.y}px`,
          transform: 'translate(-50%, -108%)',
          zIndex: 1100,
        }"
      >
        <div class="p-tooltip-arrow" data-pc-section="arrow" />
        <div class="p-tooltip-text" data-pc-section="text">
          {{ activeTooltip.text }}
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.office-scene-shell {
  position: relative;
  width: 100%;
  max-width: 960px;
}

.office-scene {
  display: block;
  width: 100%;
  height: auto;
  border: 1px solid rgb(0 0 0 / 8%);
  border-radius: 12px;
  background: var(--office-wall);
  pointer-events: none;
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
}

.office-scene__hit-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.office-scene__bot-hit {
  position: absolute;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
}

.office-scene__bot-hit:focus,
.office-scene__bot-hit:focus-visible,
.office-scene__bot-hit--restored-focus {
  outline: 2px solid #2563eb;
  outline-offset: 1px;
  border-radius: 4px;
}
</style>

<style>
.office-scene-tooltip {
  pointer-events: none;
  width: fit-content;
  padding: 0.5rem 0.75rem;
  border-radius: var(--p-content-border-radius, 6px);
  background: var(--p-tooltip-background, #334155);
  color: var(--p-tooltip-color, #fff);
  box-shadow: var(--p-tooltip-shadow, 0 4px 12px rgb(0 0 0 / 15%));
}

.office-scene-tooltip .p-tooltip-text {
  font-size: 0.875rem;
  white-space: nowrap;
}
</style>
