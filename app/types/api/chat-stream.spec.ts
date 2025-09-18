import { describe, it, expect } from 'vitest'
import type { ChatStreamRequest, ChatStreamChunk } from './chat-stream'
import { AIProviderType } from '@/types/ai'

describe('ChatStreamRequest', () => {
  it('should have required properties', () => {
    const request: ChatStreamRequest = {
      provider: AIProviderType.OpenAI,
      messages: [
        { role: 'user', content: 'Hello' }
      ]
    }

    expect(request.provider).toBe(AIProviderType.OpenAI)
    expect(request.messages).toHaveLength(1)
    expect(request.messages[0].role).toBe('user')
    expect(request.messages[0].content).toBe('Hello')
  })

  it('should have required model property', () => {
    const request: ChatStreamRequest = {
      provider: AIProviderType.OpenAI,
      messages: [
        { role: 'user', content: 'Hello' }
      ],
      model: 'gpt-4o'
    }

    expect(request.model).toBe('gpt-4o')
  })

  it('should have optional properties', () => {
    const request: ChatStreamRequest = {
      provider: AIProviderType.OpenAI,
      messages: [
        { role: 'user', content: 'Hello' }
      ],
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 1000
    }

    expect(request.temperature).toBe(0.7)
    expect(request.maxTokens).toBe(1000)
  })
})

describe('ChatStreamChunk', () => {
  it('should handle content chunk', () => {
    const chunk: ChatStreamChunk = {
      provider: AIProviderType.OpenAI,
      type: 'content',
      content: 'Hello'
    }

    expect(chunk.provider).toBe(AIProviderType.OpenAI)
    expect(chunk.type).toBe('content')
    expect(chunk.content).toBe('Hello')
  })

  it('should handle done chunk', () => {
    const chunk: ChatStreamChunk = {
      provider: AIProviderType.OpenAI,
      type: 'done',
      elapsedMs: 1500
    }

    expect(chunk.type).toBe('done')
    expect(chunk.elapsedMs).toBe(1500)
  })

  it('should handle error chunk', () => {
    const chunk: ChatStreamChunk = {
      provider: AIProviderType.OpenAI,
      type: 'error',
      error: 'API Error'
    }

    expect(chunk.type).toBe('error')
    expect(chunk.error).toBe('API Error')
  })
})
