<script setup lang="ts">
import type { BotStatusKind } from '../types/bot'

defineProps<{
  kind: BotStatusKind
  idleActivity?: 'daydream' | 'coffee'
}>()
</script>

<template>
  <g v-if="kind === 'waiting'" class="status-bubble status-bubble--waiting" aria-hidden="true">
    <circle r="10" cx="0" cy="-28" class="status-bubble__bg" />
    <text x="0" y="-24" text-anchor="middle" class="status-bubble__glyph">?</text>
  </g>
  <g v-else-if="kind === 'error'" class="status-bubble status-bubble--error" aria-hidden="true">
    <circle r="10" cx="0" cy="-28" class="status-bubble__bg" />
    <text x="0" y="-24" text-anchor="middle" class="status-bubble__glyph">!</text>
  </g>
  <g
    v-else-if="kind === 'idle' && idleActivity === 'coffee'"
    class="status-bubble status-bubble--coffee"
    aria-hidden="true"
  >
    <rect x="-8" y="-34" width="16" height="10" rx="2" class="status-bubble__coffee-cup" />
    <path d="M 8 -30 L 12 -28 L 12 -26 L 8 -26 Z" class="status-bubble__coffee-cup" />
  </g>
</template>

<style scoped>
.status-bubble__bg {
  fill: var(--office-bubbleQuestion);
}

.status-bubble--error .status-bubble__bg {
  fill: var(--office-bubbleError);
}

.status-bubble__glyph {
  font-size: 14px;
  font-weight: 700;
  fill: #fff;
}

.status-bubble__coffee-cup {
  fill: var(--office-desk);
  stroke: #5c4a1f;
  stroke-width: 1;
}
</style>
