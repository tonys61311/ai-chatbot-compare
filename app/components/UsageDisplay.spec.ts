import { render, screen } from '@testing-library/vue'
import { describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'
import UsageDisplay from './UsageDisplay.vue'

function advanceTimers(ms: number) {
  vi.advanceTimersByTime(ms)
}

describe('UsageDisplay', () => {
  it('應該渲染用量與上限，未超限不顯示警示', async () => {
    vi.useFakeTimers()
    render(UsageDisplay, {
      props: { used: 0, limit: 100, exceeded: false }
    })
    expect(Boolean(screen.getByText('0 / 100 tokens'))).toBe(true)
    expect(screen.queryByRole('alert')).toBeNull()
    vi.useRealTimers()
  })

  it('超限時應顯示警示訊息', async () => {
    vi.useFakeTimers()
    render(UsageDisplay, {
      props: { used: 120, limit: 100, exceeded: true }
    })
    const alert = screen.getByRole('alert')
    expect(alert).toBeTruthy()
    expect(alert.textContent).toContain('已達使用上限')
    vi.useRealTimers()
  })

  it('數值上升時應有動畫過渡（0 -> 100 快速增加顯示）', async () => {
    vi.useFakeTimers()
    const { rerender } = render(UsageDisplay, { props: { used: 0, limit: 100, exceeded: false, durationMs: 300 } })

    expect(Boolean(screen.getByText('0 / 100 tokens'))).toBe(true)

    await rerender({ used: 100, limit: 100, exceeded: false, durationMs: 300 })
    await nextTick()

    advanceTimers(150)
    await nextTick()
    const midText = screen.getByText(/\/ 100 tokens/)
    expect(midText.textContent).not.toMatch(/^0 \/ 100 tokens$/)

    advanceTimers(1000)
    await nextTick()
    expect(Boolean(screen.getByText('100 / 100 tokens'))).toBe(true)

    vi.useRealTimers()
  })

  it('數值下降時也應有動畫過渡（100 -> 0 快速減少顯示）', async () => {
    vi.useFakeTimers()
    const { rerender } = render(UsageDisplay, { props: { used: 100, limit: 100, exceeded: false, durationMs: 300 } })

    expect(!!screen.getByText('100 / 100 tokens')).toBe(true)

    await rerender({ used: 0, limit: 100, exceeded: false, durationMs: 300 })
    await nextTick()

    advanceTimers(150)
    await nextTick()
    const midText = screen.getByText(/\/ 100 tokens/)
    expect(midText.textContent).not.toMatch(/^100 \/ 100 tokens$/)

    advanceTimers(1000)
    await nextTick()
    expect(!!screen.getByText('0 / 100 tokens')).toBe(true)

    vi.useRealTimers()
  })
})


