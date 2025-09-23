import { describe, it, expect } from 'vitest'
import type { ApiDataResponse } from './api'

describe('api.ts', () => {
  describe('ApiDataResponse', () => {
    it('should accept string data', () => {
      const response: ApiDataResponse<string> = {
        data: 'test string'
      }
      expect(response.data).toBe('test string')
    })

    it('should accept object data', () => {
      const response: ApiDataResponse<{ message: string; code: number }> = {
        data: { message: 'success', code: 200 }
      }
      expect(response.data).toEqual({ message: 'success', code: 200 })
    })

    it('should accept array data', () => {
      const response: ApiDataResponse<number[]> = {
        data: [1, 2, 3, 4, 5]
      }
      expect(response.data).toEqual([1, 2, 3, 4, 5])
    })

    it('should accept null data', () => {
      const response: ApiDataResponse<null> = {
        data: null
      }
      expect(response.data).toBeNull()
    })

    it('should accept undefined data', () => {
      const response: ApiDataResponse<undefined> = {
        data: undefined
      }
      expect(response.data).toBeUndefined()
    })

    it('should work with complex nested types', () => {
      interface ComplexType {
        id: number
        name: string
        items: Array<{
          id: string
          value: number
        }>
        metadata?: {
          created: Date
          updated: Date
        }
      }

      const response: ApiDataResponse<ComplexType> = {
        data: {
          id: 1,
          name: 'test',
          items: [
            { id: 'item1', value: 100 },
            { id: 'item2', value: 200 }
          ],
          metadata: {
            created: new Date('2023-01-01'),
            updated: new Date('2023-01-02')
          }
        }
      }

      expect(response.data.id).toBe(1)
      expect(response.data.name).toBe('test')
      expect(response.data.items).toHaveLength(2)
      expect(response.data.metadata?.created).toBeInstanceOf(Date)
    })
  })
})
