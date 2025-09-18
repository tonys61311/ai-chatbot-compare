import type { AIProviderType } from '@/types/ai'
import type { ChatMessageAPI } from './chat-batch'

// 串流請求
export interface ChatStreamRequest {
  provider: AIProviderType
  messages: ChatMessageAPI[]
  model: string
  temperature?: number
  maxTokens?: number
}

// 串流資料塊
export interface ChatStreamChunk {
  provider: AIProviderType
  type: 'content' | 'done' | 'error'
  content?: string
  error?: string
  elapsedMs?: number
}
