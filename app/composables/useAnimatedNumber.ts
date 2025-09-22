import { ref, onBeforeUnmount } from 'vue'

export type EasingFunction = (t: number) => number

export interface AnimatedNumberOptions {
  durationMs?: number
  easing?: EasingFunction
  tickMs?: number
}

const easeOutCubic: EasingFunction = (t: number) => 1 - Math.pow(1 - t, 3)

export function useAnimatedNumber(initial: number, options?: AnimatedNumberOptions) {
  const displayed = ref<number>(initial)
  const isAnimating = ref<boolean>(false)
  const duration = Math.max(0, options?.durationMs ?? 1000)
  const easing = options?.easing ?? easeOutCubic
  const tickMs = options?.tickMs ?? 16

  let intervalId: ReturnType<typeof setInterval> | null = null

  function stop() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    isAnimating.value = false
  }

  function animateTo(target: number) {
    const start = displayed.value
    if (start === target) { isAnimating.value = false; return }
    stop()
    const total = Math.max(1, duration)
    let elapsed = 0
    isAnimating.value = true
    intervalId = setInterval(() => {
      elapsed += tickMs
      const t = Math.min(1, elapsed / total)
      const eased = easing(t)
      displayed.value = Math.round(start + (target - start) * eased)
      if (t >= 1) {
        stop()
        displayed.value = Math.round(target)
      }
    }, tickMs)
  }

  onBeforeUnmount(stop)

  return { displayed, animateTo, stop, isAnimating }
}


