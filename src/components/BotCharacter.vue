<script setup lang="ts">
import { computed, toRef } from 'vue'

import StatusBubble from './StatusBubble.vue'

import type { Bot } from '../types/bot'
import type { Point } from '../types/theme'

const props = defineProps<{
  bot: Bot
  position: Point
}>()

const botRef = toRef(props, 'bot')

const statusKind = computed(() => botRef.value.status.kind)

const idleActivity = computed(() =>
  botRef.value.status.kind === 'idle' ? botRef.value.status.activity : undefined,
)

const motionClass = computed(() => {
  const status = botRef.value.status
  if (status.kind === 'working') return 'bot-motion--working'
  if (status.kind === 'waiting') return 'bot-motion--waiting'
  if (status.kind === 'error') return 'bot-motion--error'
  if (status.kind === 'messaging') return 'bot-motion--messaging'
  if (status.kind === 'idle' && status.activity === 'coffee') return 'bot-motion--coffee'
  return 'bot-motion--idle'
})

const avatarHue = computed(() => hueFromId(props.bot.id))

function hueFromId(id: string) {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) | 0
  }
  return Math.abs(hash) % 360
}
</script>

<template>
  <g
    class="bot-character"
    :class="motionClass"
    :data-bot-id="bot.id"
    :data-bot-status="statusKind"
    :transform="`translate(${position.x} ${position.y})`"
    aria-hidden="true"
  >
    <ellipse cx="0" cy="14" rx="14" ry="4" class="bot-character__shadow" />
    <g class="bot-character__body-group">
      <rect x="-10" y="2" width="20" height="18" rx="6" :fill="`hsl(${avatarHue} 45% 55%)`" />
      <circle cx="0" cy="-6" r="9" :fill="`hsl(${avatarHue} 50% 75%)`" />
      <g class="bot-character__hands">
        <rect x="-14" y="6" width="6" height="4" rx="2" fill="#f5d0a9" />
        <rect x="8" y="6" width="6" height="4" rx="2" fill="#f5d0a9" />
      </g>
    </g>
    <StatusBubble :kind="statusKind" :idle-activity="idleActivity" />
    <text y="32" text-anchor="middle" class="bot-character__name">{{ bot.name }}</text>
  </g>
</template>

<style scoped>
.bot-character__shadow {
  fill: rgb(0 0 0 / 12%);
}

.bot-character__name {
  font-size: 11px;
  fill: #4a4035;
}

.bot-character__hands {
  transform-origin: 0 8px;
}
</style>
