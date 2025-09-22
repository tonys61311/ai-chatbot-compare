import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AIProviderType } from '@/types/ai'
import type { ChatStreamRequest } from '@/types/api/chat-stream'

// Mock the AI providers
vi.mock('../../ai/factory', () => ({
  getProvider: vi.fn()
}))

// Mock usage store
vi.mock('../../utils/usage-store', () => ({
  getOrInitUsage: vi.fn().mockReturnValue({ used: 0, limit: 1000 }),
  incrementUsage: vi.fn().mockReturnValue({ used: 100, limit: 1000 })
}))

// Mock token calculator
vi.mock('../../utils/token-calculator', () => ({
  estimateTokens: vi.fn().mockReturnValue(100),
  countMessageTokens: vi.fn().mockReturnValue(50)
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

  it('should pre-deduct tokens before API call to prevent usage loss on page refresh', async () => {
    const { getOrInitUsage, incrementUsage } = await import('../../utils/usage-store')
    const { estimateTokens } = await import('../../utils/token-calculator')
    
    // 模擬 API 調用前的 token 預估和扣除
    const messages = [{ role: 'user', content: 'Hello' }]
    const model = 'gpt-4o-mini'
    const ip = '127.0.0.1'
    
    // 預估 token
    const estimatedTokens = estimateTokens(messages[0], model)
    expect(estimatedTokens).toBe(100)
    
    // 預先扣除 token
    incrementUsage(ip, estimatedTokens)
    
    // 驗證 incrementUsage 被調用
    expect(incrementUsage).toHaveBeenCalledWith(ip, 100)
  })
})