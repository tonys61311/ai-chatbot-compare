import { defineStore } from 'pinia'
import { reactive } from 'vue'
import type { AIProviderType, ProviderModel } from '@/types/ai'
import type { ChatMessage, ChatResult, ModelChat } from '@/types/api/chat-batch'
import type { ChatStreamRequest, ChatStreamChunk } from '@/types/api/chat-stream'
import { generateId, escapeHtml } from '@/utils/helpers'
import { apiClient } from '@/utils/api'
import { ALL_AI_PROVIDERS } from '@/types/ai'

interface ProviderChatState {
  messages: ChatMessage[]
  loading: boolean
  streaming: boolean
}

interface ChatState {
  byProvider: Partial<Record<AIProviderType, ProviderChatState>>
  models: Partial<Record<AIProviderType, ProviderModel[]>>
  modelsLoaded: boolean
  usage: { used: number; limit: number }
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    byProvider: {},
    models: {},
    modelsLoaded: false,
    usage: { used: 0, limit: 0 }
  }),
  getters: {
    isModelsLoaded: (state) => state.modelsLoaded,
    getUsage: (state) => state.usage,
    isUsageExceeded: (state) => state.usage.limit > 0 && state.usage.used >= state.usage.limit,
    getMessages: (state) => (provider: AIProviderType): ChatMessage[] => {
      return state.byProvider[provider]?.messages || []
    },
    isLoading: (state) => (provider: AIProviderType): boolean => {
      return !!state.byProvider[provider]?.loading
    },
    isStreaming: (state) => (provider: AIProviderType): boolean => {
      return !!state.byProvider[provider]?.streaming
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
      const { used, limit } = await apiClient.getUsage()
        this.usage.used = used
        this.usage.limit = limit
        if (this.usage.limit > 0 && this.usage.used >= this.usage.limit) {
          const modal = useModal()
          modal.alert('已達使用上限，請稍後再試。', '用量超過', 'danger')
        }
    },
    ensureProvider(provider: AIProviderType) {
      if (!this.byProvider[provider]) {
        this.byProvider[provider] = reactive<ProviderChatState>({ messages: [], loading: false, streaming: false })
      }
    },
    clear(provider: AIProviderType) {
      this.ensureProvider(provider)
      this.byProvider[provider]!.messages.splice(0)
    },
    async send(provider: AIProviderType, content: string | Array<any>, model: string, opts?: { delayMs?: number; mode?: 'auto' | 'word' | 'char'; onProgress?: () => void }) {
      this.ensureProvider(provider)
      const bucket = this.byProvider[provider]!
      if (bucket.loading) return
      bucket.loading = true

      const userMsg: ChatMessage = { id: generateId(), role: 'user', content }
      bucket.messages.push(userMsg)

      try {
        const chats: ModelChat[] = [
          { provider, messages: [{ role: 'user', content }], model }
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
    // 幫我多一個callback，因位我前面有宜個isThinking，所以我要在第一次收到資料時，呼叫callback 更新外面isThinking ref = false (幫我命名) 
    async sendStream(provider: AIProviderType, content: string | Array<any>, model: string, isThinkingCallback: () => void = () => {}): Promise<{ message: ChatMessage; content: string } | undefined> {
      this.ensureProvider(provider)
      const bucket = this.byProvider[provider]!
      if (bucket.streaming) return

      bucket.streaming = true

      const userMsg: ChatMessage = { id: generateId(), role: 'user', content }
      bucket.messages.push(userMsg)

      const assistantMsg: ChatMessage = reactive({ id: generateId(), role: 'assistant', content: '' }) as ChatMessage
      bucket.messages.push(assistantMsg)

      try {
        const request: ChatStreamRequest = {
          provider,
          messages: [{ role: 'user', content }],
          model
        }

        await apiClient.chatStream(request, (chunk: ChatStreamChunk) => {
          isThinkingCallback()
          if (chunk.type === 'content' && chunk.content) {
            assistantMsg.content += chunk.content
          } else if (chunk.type === 'error' && chunk.error) {
            assistantMsg.content = `錯誤：${chunk.error}`
          } else if (chunk.type === 'done' && chunk.usage) {
            const usage = chunk.usage
            this.usage.used = usage.used
            this.usage.limit = usage.limit
          }
        })

        return { message: assistantMsg, content: typeof assistantMsg.content === 'string' ? assistantMsg.content : '' }
      } catch (e: any) {
        const errText = `錯誤：${e?.message || 'Unknown error'}`
        assistantMsg.content = errText
        return { message: assistantMsg, content: errText }
      } finally {
        bucket.streaming = false
        isThinkingCallback()
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


