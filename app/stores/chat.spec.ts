import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useChatStore } from './chat'
import { AIProviderType, ALL_AI_PROVIDERS } from '@/types/ai'
import type { ProviderModels } from '@/types/ai'
import type { ChatMessage, ChatResult } from '@/types/api/chat-batch'
import type { ChatStreamChunk } from '@/types/api/chat-stream'

// Mock apiClient
vi.mock('@/utils/api', () => ({
  apiClient: {
    getProviderModels: vi.fn(),
    getUsage: vi.fn(),
    chatBatch: vi.fn(),
    chatStream: vi.fn()
  }
}))

// Mock useModal
const mockModal = {
  alert: vi.fn()
}

vi.mock('@/composables/useModal', () => ({
  useModal: () => mockModal
}))

describe('useChatStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const store = useChatStore()
      
      expect(store.byProvider).toEqual({})
      expect(store.models).toEqual({})
      expect(store.modelsLoaded).toBe(false)
      expect(store.usage).toEqual({ used: 0, limit: 0 })
    })

    it('should initialize data and load models', async () => {
      const mockModels: ProviderModels[] = [
        { type: AIProviderType.OpenAI, models: [{ id: 'gpt-4o-mini', label: 'GPT-4o mini', default: true }] }
      ]
      
      const { apiClient } = await import('@/utils/api')
      vi.mocked(apiClient.getProviderModels).mockResolvedValue(mockModels)
      vi.mocked(apiClient.getUsage).mockResolvedValue({ used: 100, limit: 1000 })

      const store = useChatStore()
      await store.initData()

      expect(store.modelsLoaded).toBe(true)
      expect(store.usage).toEqual({ used: 100, limit: 1000 })
      expect(apiClient.getProviderModels).toHaveBeenCalledWith(ALL_AI_PROVIDERS)
      expect(apiClient.getUsage).toHaveBeenCalled()
    })

  })

  describe('getters', () => {
    let store: ReturnType<typeof useChatStore>

    beforeEach(() => {
      store = useChatStore()
    })

    it('should return models loaded status', () => {
      expect(store.isModelsLoaded).toBe(false)
      store.modelsLoaded = true
      expect(store.isModelsLoaded).toBe(true)
    })

    it('should return usage', () => {
      store.usage = { used: 100, limit: 1000 }
      expect(store.getUsage).toEqual({ used: 100, limit: 1000 })
    })

    it('should check if usage exceeded', () => {
      store.usage = { used: 100, limit: 1000 }
      expect(store.isUsageExceeded).toBe(false)
      
      store.usage = { used: 1000, limit: 1000 }
      expect(store.isUsageExceeded).toBe(true)
      
      store.usage = { used: 0, limit: 0 }
      expect(store.isUsageExceeded).toBe(false)
    })

    it('should get messages for provider', () => {
      const messages: ChatMessage[] = [
        { id: '1', role: 'user' as const, content: 'Hello' },
        { id: '2', role: 'assistant' as const, content: 'Hi there' }
      ]
      
      store.byProvider[AIProviderType.OpenAI] = {
        messages,
        loading: false,
        streaming: false
      }

      expect(store.getMessages(AIProviderType.OpenAI)).toEqual(messages)
      expect(store.getMessages(AIProviderType.Gemini)).toEqual([])
    })

    it('should check loading status', () => {
      store.byProvider[AIProviderType.OpenAI] = {
        messages: [],
        loading: true,
        streaming: false
      }

      expect(store.isLoading(AIProviderType.OpenAI)).toBe(true)
      expect(store.isLoading(AIProviderType.Gemini)).toBe(false)
    })

    it('should check streaming status', () => {
      store.byProvider[AIProviderType.OpenAI] = {
        messages: [],
        loading: false,
        streaming: true
      }

      expect(store.isStreaming(AIProviderType.OpenAI)).toBe(true)
      expect(store.isStreaming(AIProviderType.Gemini)).toBe(false)
    })

    it('should get models for provider', () => {
      const models = [{ id: 'gpt-4o-mini', label: 'GPT-4o mini', default: true }]
      store.models[AIProviderType.OpenAI] = models

      expect(store.getModels(AIProviderType.OpenAI)).toEqual(models)
      expect(store.getModels(AIProviderType.Gemini)).toEqual([])
    })
  })

  describe('actions', () => {
    let store: ReturnType<typeof useChatStore>

    beforeEach(() => {
      store = useChatStore()
    })

    describe('ensureProvider', () => {
      it('should create provider state if not exists', () => {
        expect(store.byProvider[AIProviderType.OpenAI]).toBeUndefined()
        
        store.ensureProvider(AIProviderType.OpenAI)
        
        expect(store.byProvider[AIProviderType.OpenAI]).toEqual({
          messages: [],
          loading: false,
          streaming: false
        })
      })

      it('should not create provider state if already exists', () => {
        const existingState = {
          messages: [{ id: '1', role: 'user' as const, content: 'Hello' }],
          loading: true,
          streaming: false
        }
        store.byProvider[AIProviderType.OpenAI] = existingState
        
        store.ensureProvider(AIProviderType.OpenAI)
        
        expect(store.byProvider[AIProviderType.OpenAI]).toStrictEqual(existingState)
      })
    })

    describe('clear', () => {
      it('should clear messages for provider', () => {
        const messages: ChatMessage[] = [
          { id: '1', role: 'user', content: 'Hello' },
          { id: '2', role: 'assistant', content: 'Hi there' }
        ]
        
        store.byProvider[AIProviderType.OpenAI] = {
          messages: [...messages],
          loading: false,
          streaming: false
        }

        store.clear(AIProviderType.OpenAI)

        expect(store.byProvider[AIProviderType.OpenAI]?.messages).toEqual([])
      })
    })

    describe('send', () => {
      it('should send message and get response', async () => {
        const mockResult: ChatResult = {
          provider: AIProviderType.OpenAI,
          text: 'Hello there!',
          elapsedMs: 1000
        }

        const { apiClient } = await import('@/utils/api')
        vi.mocked(apiClient.chatBatch).mockResolvedValue([mockResult])

        const result = await store.send(AIProviderType.OpenAI, 'Hello', 'gpt-4o')

        expect(result).toBeDefined()
        expect(result?.content).toBe('Hello there!')
        expect(store.byProvider[AIProviderType.OpenAI]?.messages).toHaveLength(2)
        expect(store.byProvider[AIProviderType.OpenAI]?.loading).toBe(false)
      })

      it('should handle error response', async () => {
        const mockError: ChatResult = {
          provider: AIProviderType.OpenAI,
          error: 'API Error',
          elapsedMs: 1000
        }

        const { apiClient } = await import('@/utils/api')
        vi.mocked(apiClient.chatBatch).mockResolvedValue([mockError])

        const result = await store.send(AIProviderType.OpenAI, 'Hello', 'gpt-4o')

        expect(result).toBeDefined()
        expect(result?.content).toBe('錯誤：API Error')
      })

      it('should handle API error', async () => {
        const { apiClient } = await import('@/utils/api')
        vi.mocked(apiClient.chatBatch).mockRejectedValue(new Error('Network error'))

        const result = await store.send(AIProviderType.OpenAI, 'Hello', 'gpt-4o')

        expect(result).toBeDefined()
        expect(result?.content).toBe('錯誤：Network error')
      })

      it('should not send if already loading', async () => {
        store.byProvider[AIProviderType.OpenAI] = {
          messages: [],
          loading: true,
          streaming: false
        }

        const result = await store.send(AIProviderType.OpenAI, 'Hello', 'gpt-4o')

        expect(result).toBeUndefined()
        const { apiClient } = await import('@/utils/api')
        expect(apiClient.chatBatch).not.toHaveBeenCalled()
      })

      it('should handle array content', async () => {
        const mockResult: ChatResult = {
          provider: AIProviderType.OpenAI,
          text: 'Response',
          elapsedMs: 1000
        }

        const { apiClient } = await import('@/utils/api')
        vi.mocked(apiClient.chatBatch).mockResolvedValue([mockResult])

        const content = [
          { type: 'text', text: 'Hello' },
          { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,test' } }
        ]

        const result = await store.send(AIProviderType.OpenAI, content, 'gpt-4o')

        expect(result).toBeDefined()
        expect(result?.content).toBe('Response')
      })
    })

    describe('sendStream', () => {
      it('should send stream message and get response', async () => {
        const mockChunks: ChatStreamChunk[] = [
          { type: 'content', content: 'Hello', provider: AIProviderType.OpenAI },
          { type: 'content', content: ' there', provider: AIProviderType.OpenAI },
          { type: 'done', usage: { used: 100, limit: 1000 }, provider: AIProviderType.OpenAI }
        ]

        const { apiClient } = await import('@/utils/api')
        vi.mocked(apiClient.chatStream).mockImplementation((request, callback) => {
          mockChunks.forEach(chunk => callback(chunk))
          return Promise.resolve()
        })

        const isThinkingCallback = vi.fn()
        const result = await store.sendStream(AIProviderType.OpenAI, 'Hello', 'gpt-4o', isThinkingCallback)

        expect(result).toBeDefined()
        expect(result?.content).toBe('Hello there')
        expect(store.byProvider[AIProviderType.OpenAI]?.messages).toHaveLength(2)
        expect(store.byProvider[AIProviderType.OpenAI]?.streaming).toBe(false)
        expect(store.usage).toEqual({ used: 100, limit: 1000 })
        expect(isThinkingCallback).toHaveBeenCalledTimes(4) // 3 chunks + finally
      })

      it('should handle stream error', async () => {
        const mockChunks: ChatStreamChunk[] = [
          { type: 'error', error: 'Stream error', provider: AIProviderType.OpenAI }
        ]

        const { apiClient } = await import('@/utils/api')
        vi.mocked(apiClient.chatStream).mockImplementation((request, callback) => {
          mockChunks.forEach(chunk => callback(chunk))
          return Promise.resolve()
        })

        const result = await store.sendStream(AIProviderType.OpenAI, 'Hello', 'gpt-4o')

        expect(result).toBeDefined()
        expect(result?.content).toBe('錯誤：Stream error')
      })

      it('should handle API error', async () => {
        const { apiClient } = await import('@/utils/api')
        vi.mocked(apiClient.chatStream).mockRejectedValue(new Error('Network error'))

        const result = await store.sendStream(AIProviderType.OpenAI, 'Hello', 'gpt-4o')

        expect(result).toBeDefined()
        expect(result?.content).toBe('錯誤：Network error')
      })

      it('should not send if already streaming', async () => {
        store.byProvider[AIProviderType.OpenAI] = {
          messages: [],
          loading: false,
          streaming: true
        }

        const result = await store.sendStream(AIProviderType.OpenAI, 'Hello', 'gpt-4o')

        expect(result).toBeUndefined()
        const { apiClient } = await import('@/utils/api')
        expect(apiClient.chatStream).not.toHaveBeenCalled()
      })

      it('should handle array content', async () => {
        const mockChunks: ChatStreamChunk[] = [
          { type: 'content', content: 'Response', provider: AIProviderType.OpenAI }
        ]

        const { apiClient } = await import('@/utils/api')
        vi.mocked(apiClient.chatStream).mockImplementation((request, callback) => {
          mockChunks.forEach(chunk => callback(chunk))
          return Promise.resolve()
        })

        const content = [
          { type: 'text', text: 'Hello' },
          { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,test' } }
        ]

        const result = await store.sendStream(AIProviderType.OpenAI, content, 'gpt-4o')

        expect(result).toBeDefined()
        expect(result?.content).toBe('Response')
      })
    })

    describe('loadModels', () => {
    it('should load models for all providers', async () => {
      const mockModels: ProviderModels[] = [
        { type: AIProviderType.OpenAI, models: [{ id: 'gpt-4o-mini', label: 'GPT-4o mini', default: true }] },
        { type: AIProviderType.Gemini, models: [{ id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', default: true }] },
        { type: AIProviderType.DeepSeek, models: [{ id: 'deepseek-chat', label: 'DeepSeek Chat', default: true }] }
      ]
      
      const { apiClient } = await import('@/utils/api')
        vi.mocked(apiClient.getProviderModels).mockResolvedValue(mockModels)

      await store.loadModels()

      expect(apiClient.getProviderModels).toHaveBeenCalledWith(ALL_AI_PROVIDERS)
        expect(store.models[AIProviderType.OpenAI]).toEqual(mockModels[0]?.models)
        expect(store.models[AIProviderType.Gemini]).toEqual(mockModels[1]?.models)
        expect(store.models[AIProviderType.DeepSeek]).toEqual(mockModels[2]?.models)
    })

    it('should return empty array when models not loaded', () => {
      expect(store.getModels(AIProviderType.OpenAI)).toEqual([])
      })
    })
  })
})
