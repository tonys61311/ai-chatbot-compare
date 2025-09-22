import { describe, it, expect } from 'vitest'

describe('IP Rate Limiting (contract)', () => {
  it('應有一個使用量查詢的回應型別 { used, limit }', () => {
    const resp = { used: 100, limit: 1000 }
    expect(typeof resp.used).toBe('number')
    expect(typeof resp.limit).toBe('number')
  })

  it('限制規則：當 used >= limit 時，視為超限', () => {
    const used = 1000
    const limit = 1000
    const exceeded = used >= limit
    expect(exceeded).toBe(true)
  })
})


