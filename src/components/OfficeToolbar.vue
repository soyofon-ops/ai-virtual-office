<script setup lang="ts">
import Button from 'primevue/button'
import ToggleButton from 'primevue/togglebutton'
import { storeToRefs } from 'pinia'

import { useOfficeStore } from '../stores/office'

const emit = defineEmits<{
  'add-bot': []
}>()

const store = useOfficeStore()
const { simulationRunning } = storeToRefs(store)
</script>

<template>
  <header class="office-toolbar">
    <h1 class="office-toolbar__title">AI 虛擬辦公室</h1>
    <div class="office-toolbar__actions">
      <Button label="新增 bot" icon="pi pi-plus" @click="emit('add-bot')" />
      <ToggleButton
      v-model="simulationRunning"
      on-label="模擬中"
      off-label="已暫停"
      on-icon="pi pi-play"
      off-icon="pi pi-pause"
        aria-label="暫停或繼續模擬"
      />
    </div>
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

.office-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
</style>
