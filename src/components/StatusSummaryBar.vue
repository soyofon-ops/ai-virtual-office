<script setup lang="ts">
import { computed } from 'vue'

import { useOfficeStore } from '../stores/office'
import type { BotStatusKind } from '../types/bot'

const store = useOfficeStore()

const labels: Record<BotStatusKind, string> = {
  working: 'working',
  idle: 'idle',
  messaging: 'messaging',
  waiting: 'waiting',
  error: 'error',
}

const summaryText = computed(() => {
  const counts = store.countsByStatus
  return (Object.keys(labels) as BotStatusKind[])
    .map((kind) => `${labels[kind]} ${counts[kind]}`)
    .join(' · ')
})
</script>

<template>
  <footer class="status-summary-bar" aria-live="polite">
    {{ summaryText }}
  </footer>
</template>

<style scoped>
.status-summary-bar {
  width: 100%;
  max-width: 960px;
  padding: 0.5rem 1rem;
  box-sizing: border-box;
  font-size: 0.875rem;
  color: rgb(0 0 0 / 55%);
  text-align: right;
}
</style>
