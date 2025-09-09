export enum AIProviderType {
  OpenAI = 'openai',
  Gemini = 'gemini',
  DeepSeek = 'deepseek'
}

export const ALL_AI_PROVIDERS: AIProviderType[] = [
  AIProviderType.OpenAI,
  AIProviderType.Gemini,
  AIProviderType.DeepSeek
]

// 聊天訊息類型（前端用）
export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

// API 相關類型（前後端共用）
export interface ChatMessageAPI {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  messages: ChatMessageAPI[]
  temperature?: number
  maxTokens?: number
}

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

export interface CompareResponse {
  results: ChatResult[]
}
