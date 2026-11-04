import type { BotId } from '../types/bot'

let lastInteractiveElement: HTMLElement | null = null

export function rememberBotInteractive(element: EventTarget | null) {
  if (element instanceof HTMLElement) {
    lastInteractiveElement = element
  }
}

export function focusBotInteractive(botId: BotId) {
  const interactive = document.querySelector(
    `[data-bot-id="${botId}"] [data-bot-interactive]`,
  )
  if (interactive instanceof HTMLElement) {
    lastInteractiveElement = interactive
    interactive.focus({ preventScroll: true })
  }
}

export function restoreLastBotInteractive() {
  if (!lastInteractiveElement) return
  lastInteractiveElement.classList.add('office-scene__bot-hit--restored-focus')
  lastInteractiveElement.focus({ preventScroll: true })
}

export function clearRestoredFocusRing() {
  lastInteractiveElement?.classList.remove('office-scene__bot-hit--restored-focus')
}
