import { describe, it, expect } from 'vitest'
import { AIProviderType } from '@/types/ai'
import type { ProviderModels } from '@/types/api/provider-models'
import { getProvider } from './factory'

describe('provider.getModels', () => {
  it('should return model lists for providers', () => {
    const openai = getProvider(AIProviderType.OpenAI).getModels()
    const gemini = getProvider(AIProviderType.Gemini).getModels()
    const deepseek = getProvider(AIProviderType.DeepSeek).getModels()

    expect(openai.some(m => m.id === 'gpt-4o-mini')).toBe(true)
    expect(gemini.some(m => m.id === 'gemini-1.5-flash')).toBe(true)
    expect(deepseek.some(m => m.id === 'deepseek-chat')).toBe(true)
  })
})


