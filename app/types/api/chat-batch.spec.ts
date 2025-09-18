import { describe, it, expect } from 'vitest'
import type { ModelChat, ChatBatchRequest, ChatSuccessResult, ChatErrorResult } from './chat-batch'
import { AIProviderType } from '@/types/ai'

describe('ModelChat', () => {
  it('should have required properties', () => {
    const chat: ModelChat = {
      provider: AIProviderType.OpenAI,
      messages: [
        { role: 'user', content: 'Hello' }
      ],
      model: 'gpt-4o-mini' // 添加必需的 model 屬性
    }

    expect(chat.provider).toBe(AIProviderType.OpenAI)
    expect(chat.messages).toHaveLength(1)
    expect(chat.messages[0]?.role).toBe('user')
    expect(chat.messages[0]?.content).toBe('Hello')
  })

  it('should have required model property', () => {
    const chat: ModelChat = {
      provider: AIProviderType.OpenAI,
      messages: [
        { role: 'user', content: 'Hello' }
      ],
      model: 'gpt-4o'
    }

    expect(chat.model).toBe('gpt-4o')
  })

  it('should have optional properties', () => {
    const chat: ModelChat = {
      provider: AIProviderType.OpenAI,
      messages: [
        { role: 'user', content: 'Hello' }
      ],
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 1000
    }

    expect(chat.temperature).toBe(0.7)
    expect(chat.maxTokens).toBe(1000)
  })
})

describe('ChatBatchRequest', () => {
  it('should be an array of ModelChat', () => {
    const request: ChatBatchRequest = [
      {
        provider: AIProviderType.OpenAI,
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gpt-4o-mini'
      },
      {
        provider: AIProviderType.Gemini,
        messages: [{ role: 'user', content: 'Hi' }],
        model: 'gemini-1.5-flash'
      }
    ]

    expect(request).toHaveLength(2)
    expect(request[0]?.provider).toBe(AIProviderType.OpenAI)
    expect(request[1]?.provider).toBe(AIProviderType.Gemini)
  })
})

describe('ChatResult', () => {
  it('should handle success result', () => {
    const result: ChatSuccessResult = {
      provider: AIProviderType.OpenAI,
      text: 'Hello world',
      elapsedMs: 1500
    }

    expect(result.provider).toBe(AIProviderType.OpenAI)
    expect(result.text).toBe('Hello world')
    expect(result.elapsedMs).toBe(1500)
  })

  it('should handle error result', () => {
    const result: ChatErrorResult = {
      provider: AIProviderType.OpenAI,
      error: 'API Error',
      elapsedMs: 500
    }

    expect(result.provider).toBe(AIProviderType.OpenAI)
    expect(result.error).toBe('API Error')
    expect(result.elapsedMs).toBe(500)
  })
})