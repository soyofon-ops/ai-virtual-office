<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import Button from 'primevue/button'
import Drawer from 'primevue/drawer'
import ProgressBar from 'primevue/progressbar'
import Tag from 'primevue/tag'
import Timeline from 'primevue/timeline'
import { useConfirm } from 'primevue/useconfirm'
import { storeToRefs } from 'pinia'

import { useOfficeStore } from '../stores/office'
import type { BotId } from '../types/bot'
import {
  formatEventTime,
  formatStatusDuration,
  statusLabel,
  statusTagSeverity,
} from '../utils/botStatus'
import { focusBotInteractive, restoreLastBotInteractive } from '../utils/botFocus'

const store = useOfficeStore()
const { selectedBot, selectedBotId } = storeToRefs(store)
const confirm = useConfirm()

const visible = computed({
  get: () => selectedBotId.value !== null,
  set: (open: boolean) => {
    if (!open) store.selectBot(null)
  },
})

const focusRestoreBotId = ref<BotId | null>(null)

watch(selectedBotId, (id, previousId) => {
  if (id) {
    focusRestoreBotId.value = id
    return
  }
  if (previousId) {
    restoreFocusToCharacter()
  }
})

function restoreFocusToCharacter() {
  window.setTimeout(() => {
    const botId = focusRestoreBotId.value
    if (botId) focusBotInteractive(botId)
    restoreLastBotInteractive()
  }, 500)
}

const nowTick = ref(Date.now())
let durationTimer: ReturnType<typeof setInterval> | undefined

watch(
  visible,
  (open) => {
    if (durationTimer) {
      clearInterval(durationTimer)
      durationTimer = undefined
    }
    if (open) {
      nowTick.value = Date.now()
      durationTimer = setInterval(() => {
        nowTick.value = Date.now()
      }, 1000)
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  if (durationTimer) clearInterval(durationTimer)
})

const statusDuration = computed(() => {
  const bot = selectedBot.value
  if (!bot) return '00:00'
  return formatStatusDuration(bot.status.since, nowTick.value)
})

const taskProgressPercent = computed(() => {
  const task = selectedBot.value?.task
  if (!task) return 0
  return Math.round(task.progress * 100)
})

const timelineEvents = computed(() => {
  const bot = selectedBot.value
  if (!bot) return []
  return [...bot.history].reverse().slice(0, 8).map((event) => ({
    at: event.at,
    label: `${formatEventTime(event.at)} ${event.note}`,
    status: event.status,
  }))
})

function confirmRemove() {
  const bot = selectedBot.value
  if (!bot) return
  const id = bot.id
  confirm.require({
    message: `確定要移除「${bot.name}」嗎？`,
    header: '移除 bot',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: '取消',
    acceptLabel: '移除',
    rejectClass: 'p-button-secondary',
    acceptClass: 'p-button-danger',
    accept: () => {
      store.removeBot(id as BotId)
    },
  })
}
</script>

<template>
  <Drawer
    v-model:visible="visible"
    position="right"
    :header="selectedBot ? `${selectedBot.name} · 詳情` : 'Bot 詳情'"
    class="bot-detail-drawer"
    :style="{ width: 'min(360px, 92vw)' }"
    @after-hide="restoreFocusToCharacter"
  >
    <template v-if="selectedBot">
      <div class="bot-detail-drawer__section">
        <div class="bot-detail-drawer__row">
          <span class="bot-detail-drawer__label">狀態</span>
          <Tag
            :value="statusLabel(selectedBot.status.kind)"
            :severity="statusTagSeverity(selectedBot.status.kind)"
          />
        </div>
        <p class="bot-detail-drawer__meta">持續 {{ statusDuration }}</p>
      </div>

      <div v-if="selectedBot.task" class="bot-detail-drawer__section">
        <h3 class="bot-detail-drawer__heading">目前任務</h3>
        <p class="bot-detail-drawer__task-title">
          {{ selectedBot.task.title }} · 進度 {{ taskProgressPercent }}%
        </p>
        <ProgressBar :value="taskProgressPercent" :show-value="false" />
      </div>
      <div v-else class="bot-detail-drawer__section">
        <h3 class="bot-detail-drawer__heading">目前任務</h3>
        <p class="bot-detail-drawer__meta">尚無進行中的任務</p>
      </div>

      <div class="bot-detail-drawer__section">
        <h3 class="bot-detail-drawer__heading">最近事件</h3>
        <Timeline :value="timelineEvents" align="left">
          <template #content="slotProps">
            <small class="bot-detail-drawer__timeline">{{ slotProps.item.label }}</small>
          </template>
        </Timeline>
      </div>

      <Button
        label="移除 bot"
        severity="danger"
        text
        class="bot-detail-drawer__remove"
        @click="confirmRemove"
      />
    </template>
  </Drawer>
</template>

<style scoped>
.bot-detail-drawer__section {
  margin-bottom: 1.25rem;
}

.bot-detail-drawer__row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.bot-detail-drawer__label {
  font-weight: 600;
}

.bot-detail-drawer__heading {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
}

.bot-detail-drawer__meta,
.bot-detail-drawer__task-title {
  margin: 0.35rem 0 0.5rem;
  color: var(--p-text-muted-color, #6b7280);
  font-size: 0.9rem;
}

.bot-detail-drawer__timeline {
  color: var(--p-text-muted-color, #6b7280);
}

.bot-detail-drawer__remove {
  margin-top: 0.5rem;
}
</style>
