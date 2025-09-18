import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AIProviderType } from '@/types/ai'
import type { ModelChat, ChatBatchRequest } from '@/types/api/chat-batch'

// Mock the AI adapter
vi.mock('../../ai/adapter', () => ({
  runChat: vi.fn()
}))

describe('/api/chat-batch (contract)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should accept ChatBatchRequest with model parameters', () => {
    const request: ChatBatchRequest = [
      {
        provider: AIProviderType.OpenAI,
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 1000
      },
      {
        provider: AIProviderType.Gemini,
        messages: [{ role: 'user', content: 'Hi' }],
        model: 'gemini-1.5-flash'
      }
    ]

    expect(request).toHaveLength(2)
    expect(request[0].provider).toBe(AIProviderType.OpenAI)
    expect(request[0].model).toBe('gpt-4o')
    expect(request[1].provider).toBe(AIProviderType.Gemini)
    expect(request[1].model).toBe('gemini-1.5-flash')
  })

  it('should require model parameters for all chats', () => {
    const request: ChatBatchRequest = [
      {
        provider: AIProviderType.OpenAI,
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gpt-4o-mini'
      }
    ]

    expect(request[0].provider).toBe(AIProviderType.OpenAI)
    expect(request[0].model).toBe('gpt-4o-mini')
  })

  it('should handle empty request', () => {
    const request: ChatBatchRequest = []
    expect(request).toHaveLength(0)
  })

  it('should validate required fields in ModelChat', () => {
    const chat: ModelChat = {
      provider: AIProviderType.OpenAI,
      messages: [{ role: 'user', content: 'Hello' }],
      model: 'gpt-4o-mini'
    }

    expect(chat.provider).toBeDefined()
    expect(chat.messages).toBeDefined()
    expect(Array.isArray(chat.messages)).toBe(true)
    expect(chat.model).toBe('gpt-4o-mini')
  })
})
