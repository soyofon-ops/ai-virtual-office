import type { BotStatus, BotStatusKind } from '../types/bot'

const STATUS_LABELS: Record<BotStatusKind, string> = {
  working: 'working',
  idle: 'idle',
  messaging: 'messaging',
  waiting: 'waiting',
  error: 'error',
}

export function statusLabel(kind: BotStatusKind): string {
  return STATUS_LABELS[kind]
}

export function statusTagSeverity(
  kind: BotStatusKind,
): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
  switch (kind) {
    case 'working':
      return 'success'
    case 'idle':
      return 'secondary'
    case 'messaging':
      return 'info'
    case 'waiting':
      return 'warn'
    case 'error':
      return 'danger'
    default:
      return 'secondary'
  }
}

export function formatStatusDuration(since: number, now = Date.now()): string {
  const totalSeconds = Math.max(0, Math.floor((now - since) / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function botTooltipText(name: string, status: BotStatus): string {
  return `${name} · ${statusLabel(status.kind)}`
}

export function formatEventTime(at: number): string {
  const date = new Date(at)
  return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })
}
