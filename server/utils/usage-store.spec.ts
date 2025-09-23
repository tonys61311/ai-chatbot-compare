import { describe, it, expect, beforeEach } from 'vitest'
import { getOrInitUsage, setUsage, incrementUsage, USAGE_STORE, type UsageRecord } from './usage-store'

describe('usage-store', () => {
  beforeEach(() => {
    // Clear the store before each test
    USAGE_STORE.clear()
  })

  describe('getOrInitUsage', () => {
    it('should return existing usage record', () => {
      const ip = '192.168.1.1'
      const existingRecord: UsageRecord = { used: 100, limit: 1000 }
      USAGE_STORE.set(ip, existingRecord)

      const result = getOrInitUsage(ip)

      expect(result).toEqual(existingRecord)
    })

    it('should create new usage record with default limit', () => {
      const ip = '192.168.1.1'
      const result = getOrInitUsage(ip)

      expect(result).toEqual({ used: 0, limit: 1000 })
      expect(USAGE_STORE.get(ip)).toEqual(result)
    })

    it('should create new usage record with custom limit', () => {
      const ip = '192.168.1.1'
      const customLimit = 2000
      const result = getOrInitUsage(ip, customLimit)

      expect(result).toEqual({ used: 0, limit: customLimit })
      expect(USAGE_STORE.get(ip)).toEqual(result)
    })

    it('should handle multiple IPs independently', () => {
      const ip1 = '192.168.1.1'
      const ip2 = '192.168.1.2'
      
      const record1 = getOrInitUsage(ip1, 1000)
      const record2 = getOrInitUsage(ip2, 2000)

      expect(record1).toEqual({ used: 0, limit: 1000 })
      expect(record2).toEqual({ used: 0, limit: 2000 })
      expect(USAGE_STORE.size).toBe(2)
    })
  })

  describe('setUsage', () => {
    it('should set usage record for IP', () => {
      const ip = '192.168.1.1'
      const record: UsageRecord = { used: 500, limit: 1000 }

      setUsage(ip, record)

      expect(USAGE_STORE.get(ip)).toEqual(record)
    })

    it('should overwrite existing usage record', () => {
      const ip = '192.168.1.1'
      const initialRecord: UsageRecord = { used: 100, limit: 1000 }
      const newRecord: UsageRecord = { used: 500, limit: 2000 }

      setUsage(ip, initialRecord)
      setUsage(ip, newRecord)

      expect(USAGE_STORE.get(ip)).toEqual(newRecord)
    })
  })

  describe('incrementUsage', () => {
    it('should increment usage for existing record', () => {
      const ip = '192.168.1.1'
      const initialRecord: UsageRecord = { used: 100, limit: 1000 }
      USAGE_STORE.set(ip, initialRecord)

      const result = incrementUsage(ip, 50)

      expect(result).toEqual({ used: 150, limit: 1000 })
      expect(USAGE_STORE.get(ip)).toEqual(result)
    })

    it('should create new record and increment if not exists', () => {
      const ip = '192.168.1.1'

      const result = incrementUsage(ip, 100)

      expect(result).toEqual({ used: 100, limit: 1000 })
      expect(USAGE_STORE.get(ip)).toEqual(result)
    })

    it('should handle negative delta by setting to 0', () => {
      const ip = '192.168.1.1'
      const initialRecord: UsageRecord = { used: 100, limit: 1000 }
      USAGE_STORE.set(ip, initialRecord)

      const result = incrementUsage(ip, -50)

      expect(result).toEqual({ used: 100, limit: 1000 })
    })

    it('should handle large negative delta', () => {
      const ip = '192.168.1.1'
      const initialRecord: UsageRecord = { used: 100, limit: 1000 }
      USAGE_STORE.set(ip, initialRecord)

      const result = incrementUsage(ip, -200)

      expect(result).toEqual({ used: 100, limit: 1000 })
    })

    it('should floor decimal values', () => {
      const ip = '192.168.1.1'

      const result = incrementUsage(ip, 50.7)

      expect(result).toEqual({ used: 50, limit: 1000 })
    })

    it('should handle multiple increments', () => {
      const ip = '192.168.1.1'

      incrementUsage(ip, 100)
      incrementUsage(ip, 200)
      const result = incrementUsage(ip, 50)

      expect(result).toEqual({ used: 350, limit: 1000 })
    })
  })
})
