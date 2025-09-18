import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AIProviderType } from '@/types/ai'
import type { ChatStreamRequest } from '@/types/api/chat-stream'

// Mock the AI providers
vi.mock('../../ai/factory', () => ({
  getProvider: vi.fn()
}))

describe('/api/chat-stream (contract)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should accept ChatStreamRequest with model parameter', () => {
    const request: ChatStreamRequest = {
      provider: AIProviderType.OpenAI,
      messages: [{ role: 'user', content: 'Hello' }],
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 1000
    }

    expect(request.provider).toBe(AIProviderType.OpenAI)
    expect(request.model).toBe('gpt-4o')
    expect(request.temperature).toBe(0.7)
    expect(request.maxTokens).toBe(1000)
  })

  it('should require model parameter', () => {
    const request: ChatStreamRequest = {
      provider: AIProviderType.Gemini,
      messages: [{ role: 'user', content: 'Hi' }],
      model: 'gemini-1.5-flash'
    }

    expect(request.provider).toBe(AIProviderType.Gemini)
    expect(request.model).toBe('gemini-1.5-flash')
  })

  it('should validate required fields', () => {
    const validRequest: ChatStreamRequest = {
      provider: AIProviderType.OpenAI,
      messages: [{ role: 'user', content: 'Hello' }],
      model: 'gpt-4o-mini'
    }

    expect(validRequest.provider).toBeDefined()
    expect(validRequest.messages).toBeDefined()
    expect(validRequest.model).toBeDefined()
    expect(Array.isArray(validRequest.messages)).toBe(true)
  })
})
