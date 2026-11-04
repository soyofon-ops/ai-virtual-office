import { describe, expect, it } from 'vitest'
import { weightedPick } from '../src/simulation/rules'
import type { BotStatusKind } from '../src/types/bot'

function tallyPick(
  weights: Partial<Record<BotStatusKind, number>>,
  trials: number,
): { transitions: Partial<Record<BotStatusKind, number>>; stay: number } {
  const transitions: Partial<Record<BotStatusKind, number>> = {}
  let stay = 0
  for (let index = 0; index < trials; index++) {
    const roll = index / trials
    const picked = weightedPick(weights, () => roll)
    if (picked === null) {
      stay += 1
    } else {
      transitions[picked] = (transitions[picked] ?? 0) + 1
    }
  }
  return { transitions, stay }
}

describe('weightedPick', () => {
  it('leaves ~40% unchanged for idle → working weight 0.6', () => {
    const { transitions, stay } = tallyPick({ working: 0.6 }, 1000)
    expect(transitions.working).toBe(600)
    expect(stay).toBe(400)
  })

  it('splits working exits into 20% messaging, 5% error, 75% stay', () => {
    const { transitions, stay } = tallyPick({ messaging: 0.2, error: 0.05 }, 1000)
    expect(transitions.messaging).toBe(200)
    expect(transitions.error).toBe(50)
    expect(stay).toBe(750)
  })

  it('leaves ~60% unchanged for waiting → working weight 0.4', () => {
    const { transitions, stay } = tallyPick({ working: 0.4 }, 1000)
    expect(transitions.working).toBe(400)
    expect(stay).toBe(600)
  })

  it('returns null when roll falls in the remainder bucket', () => {
    expect(weightedPick({ working: 0.6 }, () => 0.85)).toBeNull()
    expect(weightedPick({ messaging: 0.2, error: 0.05 }, () => 0.9)).toBeNull()
  })
})
