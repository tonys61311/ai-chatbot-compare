import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useChatStore } from './chat'
import { AIProviderType } from '@/types/ai'
import type { ChatStreamChunk } from '@/types/api/chat-stream'

// Mock apiClient
vi.mock('@/utils/api', () => ({
  apiClient: {
    chatStream: vi.fn()
  }
}))

describe('ChatStore Streaming', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('isStreaming', () => {
    it('should return false when not streaming', () => {
      const store = useChatStore()
      store.ensureProvider(AIProviderType.OpenAI)
      
      expect(store.isStreaming(AIProviderType.OpenAI)).toBe(false)
    })

    it('should return true when streaming', () => {
      const store = useChatStore()
      store.ensureProvider(AIProviderType.OpenAI)
      store.byProvider[AIProviderType.OpenAI]!.streaming = true
      
      expect(store.isStreaming(AIProviderType.OpenAI)).toBe(true)
    })
  })

  describe('sendStream', () => {
    it('should handle successful stream with content chunks', async () => {
      const { apiClient } = await import('@/utils/api')
      const mockChatStream = vi.mocked(apiClient.chatStream)
      
      mockChatStream.mockImplementation(async (request, onChunk) => {
        // Simulate streaming chunks
        onChunk({
          provider: AIProviderType.OpenAI,
          type: 'content',
          content: 'Hello'
        })
        onChunk({
          provider: AIProviderType.OpenAI,
          type: 'content',
          content: ' there'
        })
        onChunk({
          provider: AIProviderType.OpenAI,
          type: 'done',
          elapsedMs: 1500
        })
      })

      const store = useChatStore()
      store.ensureProvider(AIProviderType.OpenAI)
      
      const result = await store.sendStream(AIProviderType.OpenAI, 'Hello', 'gpt-4o')
      
      expect(result.message.role).toBe('assistant')
      expect(result.message.content).toBe('Hello there')
      expect(store.isStreaming(AIProviderType.OpenAI)).toBe(false)
      expect(mockChatStream).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: AIProviderType.OpenAI,
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'gpt-4o'
        }),
        expect.any(Function)
      )
    })

    it('should handle error chunks', async () => {
      const { apiClient } = await import('@/utils/api')
      const mockChatStream = vi.mocked(apiClient.chatStream)
      
      mockChatStream.mockImplementation(async (request, onChunk) => {
        onChunk({
          provider: AIProviderType.OpenAI,
          type: 'error',
          error: 'API Error'
        })
      })

      const store = useChatStore()
      store.ensureProvider(AIProviderType.OpenAI)
      
      const result = await store.sendStream(AIProviderType.OpenAI, 'Hello', 'gpt-4o')
      
      expect(result.message.role).toBe('assistant')
      expect(result.message.content).toBe('錯誤：API Error')
      expect(store.isStreaming(AIProviderType.OpenAI)).toBe(false)
    })

    it('should not start stream if already streaming', async () => {
      const { apiClient } = await import('@/utils/api')
      const mockChatStream = vi.mocked(apiClient.chatStream)
      
      const store = useChatStore()
      store.ensureProvider(AIProviderType.OpenAI)
      store.byProvider[AIProviderType.OpenAI]!.streaming = true
      
      const result = await store.sendStream(AIProviderType.OpenAI, 'Hello', 'gpt-4o')
      
      expect(result).toBeUndefined()
      expect(mockChatStream).not.toHaveBeenCalled()
    })

    it('should handle network errors', async () => {
      const { apiClient } = await import('@/utils/api')
      const mockChatStream = vi.mocked(apiClient.chatStream)
      
      mockChatStream.mockRejectedValue(new Error('Network error'))

      const store = useChatStore()
      store.ensureProvider(AIProviderType.OpenAI)
      
      const result = await store.sendStream(AIProviderType.OpenAI, 'Hello', 'gpt-4o')
      
      expect(result.message.role).toBe('assistant')
      expect(result.message.content).toBe('錯誤：Network error')
      expect(store.isStreaming(AIProviderType.OpenAI)).toBe(false)
    })
  })
})
