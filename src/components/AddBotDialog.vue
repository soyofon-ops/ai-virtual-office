<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { useToast } from 'primevue/usetoast'
import { storeToRefs } from 'pinia'

import { useOfficeStore } from '../stores/office'
import { themeRegistry } from '../themes/registry'
import type { BotStatusKind, SeatId } from '../types/bot'
import { statusLabel } from '../utils/botStatus'

const visible = defineModel<boolean>('visible', { default: false })

const store = useOfficeStore()
const { themeId, freeSeats } = storeToRefs(store)
const toast = useToast()

const name = ref('')
const avatar = ref('default')
const seatId = ref<SeatId | null>(null)
const initialStatus = ref<BotStatusKind>('idle')

const avatarOptions = computed(() => {
  const theme = themeRegistry.get(themeId.value)
  const keys = theme ? Object.keys(theme.avatars) : ['default']
  return keys.map((key) => ({ label: key, value: key }))
})

const seatOptions = computed(() => {
  const auto = { label: '自動分配空位', value: null as SeatId | null }
  const seats = freeSeats.value.map((seat, index) => ({
    label: `座位 ${index + 1} (${seat.id})`,
    value: seat.id,
  }))
  return [auto, ...seats]
})

const statusOptions = computed(() =>
  (['idle', 'working', 'waiting', 'error'] as const).map((kind) => ({
    label: statusLabel(kind),
    value: kind,
  })),
)

const seatsFull = computed(() => freeSeats.value.length === 0)

function resetForm() {
  name.value = ''
  avatar.value = avatarOptions.value[0]?.value ?? 'default'
  seatId.value = null
  initialStatus.value = 'idle'
}

watch(visible, (open) => {
  if (!open) return
  resetForm()
})

function close() {
  visible.value = false
}

function submit() {
  const id = store.addBot({
    name: name.value,
    avatar: avatar.value,
    seatId: seatId.value ?? undefined,
    initialStatus: initialStatus.value,
  })

  if (!id) {
    toast.add({
      severity: 'warn',
      summary: '無空位',
      detail: '所有座位都已占用，無法新增 bot。',
      life: 4000,
    })
    return
  }

  toast.add({
    severity: 'success',
    summary: '已新增 bot',
    detail: name.value.trim() || '新 bot 已加入辦公室。',
    life: 3000,
  })
  close()
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="新增 bot"
    :style="{ width: 'min(420px, 94vw)' }"
    :closable="true"
  >
    <div class="add-bot-form">
      <label class="add-bot-form__field">
        <span>名稱</span>
        <InputText v-model="name" placeholder="留空則自動命名" class="add-bot-form__control" />
      </label>

      <label class="add-bot-form__field">
        <span>角色外觀</span>
        <Select
          v-model="avatar"
          :options="avatarOptions"
          option-label="label"
          option-value="value"
          class="add-bot-form__control"
        />
      </label>

      <label class="add-bot-form__field">
        <span>座位</span>
        <Select
          v-model="seatId"
          :options="seatOptions"
          option-label="label"
          option-value="value"
          :disabled="seatsFull"
          placeholder="選擇空位"
          class="add-bot-form__control"
        />
      </label>

      <label class="add-bot-form__field">
        <span>初始狀態</span>
        <Select
          v-model="initialStatus"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          class="add-bot-form__control"
        />
      </label>

      <p v-if="seatsFull" class="add-bot-form__hint">座位已滿：請先移除 bot 再新增。</p>
    </div>

    <template #footer>
      <Button label="取消" severity="secondary" text @click="close" />
      <Button label="建立" :disabled="seatsFull" @click="submit" />
    </template>
  </Dialog>
</template>

<style scoped>
.add-bot-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.add-bot-form__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.9rem;
}

.add-bot-form__control {
  width: 100%;
}

.add-bot-form__hint {
  margin: 0;
  font-size: 0.85rem;
  color: var(--p-orange-500, #f97316);
}
</style>
