import {
  asBotId,
  asSeatId,
  createBotId,
  type Bot,
  type BotStatus,
  type Task,
} from '../types/bot'

export const BOT_NAME_POOL = [
  '小助',
  '研發君',
  '資料妹',
  '測試仔',
  '文件姐',
  '排程哥',
  'Review _bot',
  'Deploy 喵',
]

export const TASK_TITLE_POOL = [
  '整理週報',
  '修復登入錯誤',
  '撰寫 API 文件',
  '重構 store 模組',
  '跑 E2E 測試',
  '更新依賴版本',
]

export const ERROR_MESSAGE_POOL = [
  '連線逾時',
  '模型回應格式錯誤',
  '工具呼叫失敗',
  '記憶體不足',
  '權限被拒',
]

export function pickRandom<T>(items: readonly T[], roll: () => number): T {
  const index = Math.floor(roll() * items.length) % items.length
  return items[index]!
}

export function createTask(now: number, roll: () => number): Task {
  return {
    id: crypto.randomUUID(),
    title: pickRandom(TASK_TITLE_POOL, roll),
    progress: 0,
    startedAt: now,
  }
}

export function idleActivity(roll: () => number): 'daydream' | 'coffee' {
  return roll() < 0.5 ? 'daydream' : 'coffee'
}

function botSeed(
  id: string,
  name: string,
  seat: string,
  avatar: string,
  status: BotStatus,
  task: Task | null,
): Bot {
  return {
    id: asBotId(id),
    name,
    avatar,
    seatId: asSeatId(seat),
    status,
    task,
    history: [{ at: status.since, status: status.kind, note: '初始狀態' }],
  }
}

export function createDefaultBots(now: number): Record<string, Bot> {
  const workingTask = createTask(now, () => 0.2)
  workingTask.progress = 0.35

  const bots: Bot[] = [
    botSeed('seed-a', 'Bot A', 'seat-1', 'default', { kind: 'working', since: now - 8000 }, workingTask),
    botSeed('seed-b', 'Bot B', 'seat-2', 'default', { kind: 'waiting', since: now - 5000, waitingFor: 'user' }, null),
    botSeed('seed-c', 'Bot C', 'seat-3', 'default', { kind: 'error', since: now - 2000, message: ERROR_MESSAGE_POOL[0]! }, null),
    botSeed('seed-d', 'Bot D', 'seat-4', 'default', { kind: 'idle', since: now - 6000, activity: 'daydream' }, null),
    botSeed('seed-e', 'Bot E', 'seat-5', 'default', { kind: 'messaging', since: now - 1000, targetBotId: asBotId('seed-b') }, null),
  ]

  return Object.fromEntries(bots.map((b) => [b.id, b]))
}

export function suggestBotName(existingNames: Set<string>, roll: () => number): string {
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = pickRandom(BOT_NAME_POOL, roll)
    if (!existingNames.has(candidate)) return candidate
  }
  return `Bot ${createBotId().slice(0, 4)}`
}
