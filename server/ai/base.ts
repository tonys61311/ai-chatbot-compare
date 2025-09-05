import type { AIProviderType } from '@/types/ai'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
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

export abstract class BaseAIProvider {
  public readonly type: AIProviderType
  protected constructor(type: AIProviderType) {
    this.type = type
  }

  abstract chat(request: ChatRequest): Promise<string>
}


