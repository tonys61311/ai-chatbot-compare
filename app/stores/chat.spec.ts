import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useChatStore } from './chat'
import { AIProviderType, ALL_AI_PROVIDERS } from '@/types/ai'
import type { ProviderModels } from '@/types/ai'

// Mock apiClient
vi.mock('@/utils/api', () => ({
  apiClient: {
    getProviderModels: vi.fn()
  }
}))

describe('useChatStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('models', () => {
    it('should load models for all providers', async () => {
      const mockModels: ProviderModels[] = [
        { type: AIProviderType.OpenAI, models: [{ id: 'gpt-4o-mini', label: 'GPT-4o mini', default: true }] },
        { type: AIProviderType.Gemini, models: [{ id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', default: true }] },
        { type: AIProviderType.DeepSeek, models: [{ id: 'deepseek-chat', label: 'DeepSeek Chat', default: true }] }
      ]
      
      const { apiClient } = await import('@/utils/api')
      ;(apiClient.getProviderModels as any).mockResolvedValue(mockModels)

      const store = useChatStore()
      await store.loadModels()

      expect(apiClient.getProviderModels).toHaveBeenCalledWith(ALL_AI_PROVIDERS)
      expect(store.getModels(AIProviderType.OpenAI)).toEqual(mockModels[0].models)
    })

    it('should return empty array when models not loaded', () => {
      const store = useChatStore()
      expect(store.getModels(AIProviderType.OpenAI)).toEqual([])
    })
  })
})
