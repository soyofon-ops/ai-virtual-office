export interface RandomSource {
  next: () => number
}

export function createRandomSource(seed?: number): RandomSource {
  if (seed === undefined) {
    return { next: () => Math.random() }
  }
  let state = seed >>> 0
  return {
    next() {
      state = (state * 1664525 + 1013904223) >>> 0
      return state / 0x100000000
    },
  }
}
