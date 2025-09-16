import { defineStore } from 'pinia'
import { reactive } from 'vue'
import type { AIProviderType, ProviderModel } from '@/types/ai'
import type { ChatMessage, ChatResult, ModelChat } from '@/types/api/chat-batch'
import { generateId, escapeHtml } from '@/utils/helpers'
import { apiClient } from '@/utils/api'
import { ALL_AI_PROVIDERS } from '@/types/ai'

interface ProviderChatState {
  messages: ChatMessage[]
  loading: boolean
}

interface ChatState {
  byProvider: Partial<Record<AIProviderType, ProviderChatState>>
  models: Partial<Record<AIProviderType, ProviderModel[]>>
  modelsLoaded: boolean
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    byProvider: {},
    models: {},
    modelsLoaded: false
  }),
  getters: {
    isModelsLoaded: (state) => state.modelsLoaded,
    getMessages: (state) => (provider: AIProviderType): ChatMessage[] => {
      return state.byProvider[provider]?.messages || []
    },
    isLoading: (state) => (provider: AIProviderType): boolean => {
      return !!state.byProvider[provider]?.loading
    },
    getModels: (state) => (provider: AIProviderType): ProviderModel[] => {
      return state.models[provider] || []
    }
  },
  actions: {
    // initialize 先發api 載入模型資料，再載入畫面
    async initData() {
      await this.loadModels()
      this.modelsLoaded = true
    },
    ensureProvider(provider: AIProviderType) {
      if (!this.byProvider[provider]) {
        this.byProvider[provider] = reactive<ProviderChatState>({ messages: [], loading: false })
      }
    },
    clear(provider: AIProviderType) {
      this.ensureProvider(provider)
      this.byProvider[provider]!.messages.splice(0)
    },
    async send(provider: AIProviderType, prompt: string, opts?: { delayMs?: number; mode?: 'auto' | 'word' | 'char'; onProgress?: () => void }) {
      this.ensureProvider(provider)
      const bucket = this.byProvider[provider]!
      if (bucket.loading) return
      bucket.loading = true

      const userMsg: ChatMessage = { id: generateId(), role: 'user', content: prompt }
      bucket.messages.push(userMsg)

      try {
        const chats: ModelChat[] = [
          { provider, messages: [{ role: 'user', content: prompt }] }
        ]
        const results: ChatResult[] = await apiClient.chatBatch(chats)
        const item = results[0]
        const isError = !!item && 'error' in item
        const raw = isError ? `錯誤：${(item as any).error}` : (item?.text || '')
        const html = isError ? escapeHtml(raw) : raw

        const assistantMsg: ChatMessage = reactive({ id: generateId(), role: 'assistant', content: '' }) as ChatMessage
        bucket.messages.push(assistantMsg)
        return { message: assistantMsg, content: html }
      } catch (e: any) {
        const errText = `錯誤：${e?.message || 'Unknown error'}`
        const errMsg: ChatMessage = reactive({ id: generateId(), role: 'assistant', content: '' }) as ChatMessage
        bucket.messages.push(errMsg)
        return { message: errMsg, content: escapeHtml(errText) }
      } finally {
        bucket.loading = false
      }
    },
    async loadModels() {
      const modelsData = await apiClient.getProviderModels(ALL_AI_PROVIDERS)
      modelsData.forEach(({ type, models }) => {
        this.models[type] = models
      })
    }
  }
})


