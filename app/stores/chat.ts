import { defineStore } from 'pinia'
import { reactive } from 'vue'
import type { AIProviderType, ChatMessage, CompareResponse } from '@/types/ai'
import { ofetch } from 'ofetch'
import { generateId, escapeHtml, transformResponse, tokenizeWordsPreserveSpaces } from '@/utils/helpers'

interface ProviderChatState {
  messages: ChatMessage[]
  loading: boolean
}

interface ChatState {
  byProvider: Partial<Record<AIProviderType, ProviderChatState>>
}



export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    byProvider: {}
  }),
  getters: {
    getMessages: (state) => (provider: AIProviderType): ChatMessage[] => {
      return state.byProvider[provider]?.messages || []
    },
    isLoading: (state) => (provider: AIProviderType): boolean => {
      return !!state.byProvider[provider]?.loading
    }
  },
  actions: {
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
        const res = await ofetch<CompareResponse>('/api/compare', {
          method: 'POST',
          body: { prompt, providers: [provider] }
        })
        const item = (res?.results?.[0])
        const isError = item && 'error' in item
        const raw = isError ? `錯誤：${item.error}` : (item?.text ?? '')
        const html = isError ? escapeHtml(raw) : transformResponse(raw)

        const assistantMsg: ChatMessage = reactive({ id: generateId(), role: 'assistant', content: '' }) as ChatMessage
        bucket.messages.push(assistantMsg)
        // 回傳訊息物件，讓 component 處理串流
        return { message: assistantMsg, content: html }
      } catch (e: any) {
        const errText = `錯誤：${e?.message || 'Unknown error'}`
        const errMsg: ChatMessage = reactive({ id: generateId(), role: 'assistant', content: '' }) as ChatMessage
        bucket.messages.push(errMsg)
        // 回傳錯誤訊息物件，讓 component 處理串流
        return { message: errMsg, content: escapeHtml(errText) }
      } finally {
        bucket.loading = false
      }
    }
  }
})


