import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from './api'
import { AIProviderType } from '@/types/ai'
import type { ChatStreamRequest, ChatStreamChunk } from '@/types/api/chat-stream'
import type { ModelChat } from '@/types/api/chat-batch'

// Mock fetch for streaming and ofetch for standard requests
global.fetch = vi.fn()
vi.mock('ofetch', () => ({
  ofetch: vi.fn()
}))

describe('ApiClient with Builder Pattern', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Builder Pattern Usage', () => {
    it('should create builder for standard API calls', () => {
      const builder = (apiClient as any).createBuilder('/api/test')
      expect(builder).toBeDefined()
      expect(builder.url).toBe('/api/test')
    })

    it('should chain methods correctly', () => {
      const builder = (apiClient as any).createBuilder('/api/test')
      const chained = builder.post({ test: 'data' })
      expect(chained).toBe(builder) // Should return this
    })
  })

  describe('chatStream with Builder Pattern', () => {
    it('should handle successful stream with content chunks', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        body: {
          getReader: vi.fn().mockReturnValue({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"provider":"openai","type":"content","content":"Hello"}\n\n')
              })
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"provider":"openai","type":"content","content":" there"}\n\n')
              })
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"provider":"openai","type":"done","elapsedMs":1500}\n\n')
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined
              }),
            releaseLock: vi.fn()
          })
        }
      }

      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const request: ChatStreamRequest = {
        provider: AIProviderType.OpenAI,
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gpt-4o'
      }

      const chunks: ChatStreamChunk[] = []
      await apiClient.chatStream(request, (chunk) => {
        chunks.push(chunk)
      })

      expect(chunks).toHaveLength(3)
      expect(chunks[0]).toEqual({
        provider: AIProviderType.OpenAI,
        type: 'content',
        content: 'Hello'
      })
      expect(chunks[1]).toEqual({
        provider: AIProviderType.OpenAI,
        type: 'content',
        content: ' there'
      })
      expect(chunks[2]).toEqual({
        provider: AIProviderType.OpenAI,
        type: 'done',
        elapsedMs: 1500
      })
    })

    it('should handle error chunks', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        body: {
          getReader: vi.fn().mockReturnValue({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"provider":"openai","type":"error","error":"API Error"}\n\n')
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined
              }),
            releaseLock: vi.fn()
          })
        }
      }

      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const request: ChatStreamRequest = {
        provider: AIProviderType.OpenAI,
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gpt-4o-mini'
      }

      const chunks: ChatStreamChunk[] = []
      await apiClient.chatStream(request, (chunk) => {
        chunks.push(chunk)
      })

      expect(chunks).toHaveLength(1)
      expect(chunks[0]).toEqual({
        provider: AIProviderType.OpenAI,
        type: 'error',
        error: 'API Error'
      })
    })

    it('should handle network errors', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      const request: ChatStreamRequest = {
        provider: AIProviderType.OpenAI,
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gpt-4o'
      }

      const chunks: ChatStreamChunk[] = []
      await expect(apiClient.chatStream(request, (chunk) => {
        chunks.push(chunk)
      })).rejects.toThrow('Network error')
    })
  })

  describe('Builder Pattern Flexibility', () => {
    it('should support custom headers', async () => {
      const builder = (apiClient as any).createBuilder('/api/test')
      builder.headers = { 'Custom-Header': 'test' }
      expect(builder.headers).toEqual({ 'Custom-Header': 'test' })
    })

    it('should support stream configuration', async () => {
      const builder = (apiClient as any).createBuilder('/api/test')
      const onChunk = vi.fn()
      const chained = builder.stream(onChunk)
      
      expect(chained).toBe(builder)
      expect(builder.isStream).toBe(true)
      expect(builder.onChunk).toBe(onChunk)
    })
  })

  describe('Model Parameter Support', () => {
    it('should pass model parameter in chatStream request', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        body: {
          getReader: vi.fn().mockReturnValue({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"provider":"openai","type":"content","content":"Hello"}\n\n')
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined
              }),
            releaseLock: vi.fn()
          })
        }
      }

      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const request: ChatStreamRequest = {
        provider: AIProviderType.OpenAI,
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 1000
      }

      const chunks: ChatStreamChunk[] = []
      await apiClient.chatStream(request, (chunk) => {
        chunks.push(chunk)
      })

      expect(chunks).toHaveLength(1)
      expect(chunks[0]?.content).toBe('Hello')
      
      // Verify the request body includes model parameter
      const fetchCall = (global.fetch as any).mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)
      expect(requestBody.model).toBe('gpt-4o')
      expect(requestBody.temperature).toBe(0.7)
      expect(requestBody.maxTokens).toBe(1000)
    })

    it('should pass model parameter in chatBatch request', async () => {
      const mockResponse = {
        data: [
          {
            provider: AIProviderType.OpenAI,
            text: 'Hello from GPT-4o',
            elapsedMs: 1500
          }
        ]
      }

      const { ofetch } = await import('ofetch')
      vi.mocked(ofetch).mockResolvedValue(mockResponse)

      const chats: ModelChat[] = [
        {
          provider: AIProviderType.OpenAI,
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'gpt-4o',
          temperature: 0.7,
          maxTokens: 1000
        }
      ]

      const result = await apiClient.chatBatch(chats)

      expect(result).toEqual(mockResponse.data)
      
      // Verify the request was made with correct parameters
      expect(vi.mocked(ofetch)).toHaveBeenCalledWith('/api/chat-batch', {
        method: 'POST',
        body: chats,
        headers: {}
      })
    })
  })
})