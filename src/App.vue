<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import OfficeScene from './components/OfficeScene.vue'
import OfficeToolbar from './components/OfficeToolbar.vue'
import StatusSummaryBar from './components/StatusSummaryBar.vue'

import { useThemeCssVars } from './composables/useThemeCssVars'
import { useOfficeStore } from './stores/office'
import type { OfficeSimulationEngine } from './simulation/engine'

const store = useOfficeStore()
const { themeId, simulationRunning } = storeToRefs(store)

useThemeCssVars(themeId)

const engine = ref<OfficeSimulationEngine | null>(null)

function syncEngineRunning() {
  if (!engine.value) return
  if (simulationRunning.value) engine.value.start()
  else engine.value.stop()
}

onMounted(() => {
  if (!store.simulationRunning) store.simulationRunning = true
  engine.value = store.createSimulationEngine()
  syncEngineRunning()
})

watch(simulationRunning, syncEngineRunning)

onUnmounted(() => {
  engine.value?.stop()
})
</script>

<template>
  <div class="app-shell">
    <OfficeToolbar />
    <OfficeScene />
    <StatusSummaryBar />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  min-height: 100vh;
  padding: 1.5rem 1rem 1rem;
  box-sizing: border-box;
  background: linear-gradient(180deg, #f7f3eb 0%, #ebe4d6 100%);
}
</style>
