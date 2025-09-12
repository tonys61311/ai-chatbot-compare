import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from './api'
import { AIProviderType } from '@/types/ai'

// Mock ofetch
vi.mock('ofetch', () => ({
  ofetch: vi.fn()
}))

// Mock console methods
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('compareAI', () => {
    it('should make POST request to /api/compare with correct data', async () => {
      const mockOfetch = await import('ofetch')
      const mockResponse = {
        results: [{
          provider: 'openai',
          text: 'Test response',
          elapsedMs: 1000
        }]
      }
      ;(mockOfetch.ofetch as any).mockResolvedValue(mockResponse)

      const result = await apiClient.compareAI('test prompt', [AIProviderType.OpenAI])

      expect(mockOfetch.ofetch).toHaveBeenCalledWith('/api/compare', {
        method: 'POST',
        body: { prompt: 'test prompt', providers: [AIProviderType.OpenAI] }
      })
      expect(result).toEqual(mockResponse)
    })

    it('should log request and response data', async () => {
      const mockOfetch = await import('ofetch')
      const mockResponse = {
        results: [{
          provider: 'openai',
          text: 'Test response',
          elapsedMs: 1000
        }]
      }
      ;(mockOfetch.ofetch as any).mockResolvedValue(mockResponse)

      await apiClient.compareAI('test prompt', [AIProviderType.OpenAI])

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '🚀 API Request:',
        expect.objectContaining({
          url: '/api/compare',
          method: 'POST',
          body: { prompt: 'test prompt', providers: [AIProviderType.OpenAI] }
        })
      )
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '✅ API Response:',
        expect.objectContaining({
          url: '/api/compare',
          data: mockResponse
        })
      )
    })

    it('should handle API errors and log them', async () => {
      const mockOfetch = await import('ofetch')
      const mockError = new Error('Network error')
      ;(mockOfetch.ofetch as any).mockRejectedValue(mockError)

      await expect(apiClient.compareAI('test prompt', [AIProviderType.OpenAI])).rejects.toThrow('Network error')

      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ API Error:',
        expect.objectContaining({
          url: '/api/compare',
          error: mockError
        })
      )
    })

    it('should handle different provider types', async () => {
      const mockOfetch = await import('ofetch')
      const mockResponse = {
        results: [{
          provider: 'gemini',
          text: 'Gemini response',
          elapsedMs: 1500
        }]
      }
      ;(mockOfetch.ofetch as any).mockResolvedValue(mockResponse)

      const result = await apiClient.compareAI('test prompt', [AIProviderType.Gemini, AIProviderType.DeepSeek])

      expect(mockOfetch.ofetch).toHaveBeenCalledWith('/api/compare', {
        method: 'POST',
        body: { prompt: 'test prompt', providers: [AIProviderType.Gemini, AIProviderType.DeepSeek] }
      })
      expect(result).toEqual(mockResponse)
    })

    it('should handle empty providers array', async () => {
      const mockOfetch = await import('ofetch')
      const mockResponse = { results: [] }
      ;(mockOfetch.ofetch as any).mockResolvedValue(mockResponse)

      const result = await apiClient.compareAI('test prompt', [])

      expect(mockOfetch.ofetch).toHaveBeenCalledWith('/api/compare', {
        method: 'POST',
        body: { prompt: 'test prompt', providers: [] }
      })
      expect(result).toEqual(mockResponse)
    })
  })
})
