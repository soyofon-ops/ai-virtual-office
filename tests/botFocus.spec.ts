import { describe, expect, it } from 'vitest'

import { asBotId } from '../src/types/bot'
import { focusBotInteractive, rememberBotInteractive, restoreLastBotInteractive } from '../src/utils/botFocus'

describe('focusBotInteractive', () => {
  it('focuses the character overlay for a bot id', () => {
    document.body.innerHTML =
      '<div data-bot-id="solo"><button data-bot-interactive tabindex="0"></button></div>'
    const interactive = document.querySelector('[data-bot-interactive]') as HTMLElement
    rememberBotInteractive(interactive)
    focusBotInteractive(asBotId('solo'))
    expect(document.activeElement).toBe(interactive)
    restoreLastBotInteractive()
    expect(document.activeElement).toBe(interactive)
  })
})
