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

  describe('chatBatch', () => {
    it('should make POST request to /api/chat-batch with correct data', async () => {
      const mockOfetch = await import('ofetch')
      const mockUnwrapped = [
        {
          provider: 'openai',
          text: 'Test response',
          elapsedMs: 1000
        }
      ]
      const mockWrapped = { data: mockUnwrapped }
      ;(mockOfetch.ofetch as any).mockResolvedValue(mockWrapped)

      const result = await apiClient.chatBatch([
        { provider: AIProviderType.OpenAI, messages: [{ role: 'user', content: 'test prompt' }] }
      ])

      expect(mockOfetch.ofetch).toHaveBeenCalledWith('/api/chat-batch', {
        method: 'POST',
        body: [
          { provider: AIProviderType.OpenAI, messages: [{ role: 'user', content: 'test prompt' }] }
        ]
      })
      expect(result).toEqual(mockUnwrapped)
    })

    it('should log request and response data', async () => {
      const mockOfetch = await import('ofetch')
      const mockUnwrapped = [
        {
          provider: 'openai',
          text: 'Test response',
          elapsedMs: 1000
        }
      ]
      const mockWrapped = { data: mockUnwrapped }
      ;(mockOfetch.ofetch as any).mockResolvedValue(mockWrapped)

      await apiClient.chatBatch([
        { provider: AIProviderType.OpenAI, messages: [{ role: 'user', content: 'test prompt' }] }
      ])

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '🚀 API Request:',
        expect.objectContaining({
          url: '/api/chat-batch',
          method: 'POST',
          body: [
            { provider: AIProviderType.OpenAI, messages: [{ role: 'user', content: 'test prompt' }] }
          ]
        })
      )
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '✅ API Response:',
        expect.objectContaining({
          url: '/api/chat-batch',
          data: mockWrapped
        })
      )
    })

    it('should handle API errors and log them', async () => {
      const mockOfetch = await import('ofetch')
      const mockError = new Error('Network error')
      ;(mockOfetch.ofetch as any).mockRejectedValue(mockError)

      await expect(
        apiClient.chatBatch([
          { provider: AIProviderType.OpenAI, messages: [{ role: 'user', content: 'test prompt' }] }
        ])
      ).rejects.toThrow('Network error')

      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ API Error:',
        expect.objectContaining({
          url: '/api/chat-batch',
          error: mockError
        })
      )
    })

    it('should handle different provider types', async () => {
      const mockOfetch = await import('ofetch')
      const mockUnwrapped = [
        {
          provider: 'gemini',
          text: 'Gemini response',
          elapsedMs: 1500
        }
      ]
      const mockWrapped = { data: mockUnwrapped }
      ;(mockOfetch.ofetch as any).mockResolvedValue(mockWrapped)

      const result = await apiClient.chatBatch([
        { provider: AIProviderType.Gemini, messages: [{ role: 'user', content: 'test prompt' }] },
        { provider: AIProviderType.DeepSeek, messages: [{ role: 'user', content: 'test prompt' }] }
      ])

      expect(mockOfetch.ofetch).toHaveBeenCalledWith('/api/chat-batch', {
        method: 'POST',
        body: [
          { provider: AIProviderType.Gemini, messages: [{ role: 'user', content: 'test prompt' }] },
          { provider: AIProviderType.DeepSeek, messages: [{ role: 'user', content: 'test prompt' }] }
        ]
      })
      expect(result).toEqual(mockUnwrapped)
    })

    it('should handle empty chats array', async () => {
      const mockOfetch = await import('ofetch')
      const mockUnwrapped: any[] = []
      const mockWrapped = { data: mockUnwrapped }
      ;(mockOfetch.ofetch as any).mockResolvedValue(mockWrapped)

      const result = await apiClient.chatBatch([])

      expect(mockOfetch.ofetch).toHaveBeenCalledWith('/api/chat-batch', {
        method: 'POST',
        body: []
      })
      expect(result).toEqual([])
    })
  })

  describe('getProviderModels', () => {
    it('should make POST request to /api/provider-models and return unwrapped data', async () => {
      const mockOfetch = await import('ofetch')
      const mockUnwrapped = [
        {
          type: AIProviderType.OpenAI,
          models: [{ id: 'gpt-4o-mini', label: 'GPT-4o mini', default: true }]
        }
      ]
      const mockWrapped = { data: mockUnwrapped }
      ;(mockOfetch.ofetch as any).mockResolvedValue(mockWrapped)

      const result = await apiClient.getProviderModels([AIProviderType.OpenAI])

      expect(mockOfetch.ofetch).toHaveBeenCalledWith('/api/provider-models', {
        method: 'POST',
        body: { providers: [AIProviderType.OpenAI] }
      })
      expect(result).toEqual(mockUnwrapped)
    })
  })
})
