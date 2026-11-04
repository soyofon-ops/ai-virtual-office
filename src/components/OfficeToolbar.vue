<script setup lang="ts">
import ToggleButton from 'primevue/togglebutton'
import { storeToRefs } from 'pinia'

import { useOfficeStore } from '../stores/office'

const store = useOfficeStore()
const { simulationRunning } = storeToRefs(store)
</script>

<template>
  <header class="office-toolbar">
    <h1 class="office-toolbar__title">AI 虛擬辦公室</h1>
    <ToggleButton
      v-model="simulationRunning"
      on-label="模擬中"
      off-label="已暫停"
      on-icon="pi pi-play"
      off-icon="pi pi-pause"
      aria-label="暫停或繼續模擬"
    />
  </header>
</template>

<style scoped>
.office-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  max-width: 960px;
  padding: 0.75rem 1rem;
  box-sizing: border-box;
  border: 1px solid rgb(0 0 0 / 8%);
  border-radius: 12px;
  background: rgb(255 255 255 / 70%);
}

.office-toolbar__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}
</style>
