import type { ApiDataResponse } from '@/types/api'
import type { AIProviderType } from '@/types/ai'

export type ChatBatchResponse = ApiDataResponse<ChatResult[]>

// API 相關類型（前後端共用）
export interface ChatMessageAPI {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// 前端本地訊息型別（帶 id，且不含 system 角色）
export interface ChatMessage extends ChatMessageAPI {
  id: string
  role: 'user' | 'assistant'
}

// 單一模型互動請求
export interface ModelChat {
  provider: AIProviderType
  messages: ChatMessageAPI[]
  model: string
  temperature?: number
  maxTokens?: number
}

// 批次請求：多組模型互動
export type ChatBatchRequest = ModelChat[]

export interface ChatSuccessResult {
  provider: AIProviderType
  text: string
  elapsedMs: number
}

export interface ChatErrorResult {
  provider: AIProviderType
  error: string
  elapsedMs: number
}

export type ChatResult = ChatSuccessResult | ChatErrorResult
