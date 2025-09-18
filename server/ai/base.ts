import type { AIProviderType } from '@/types/ai'
import type { ModelChat } from '@/types/api/chat-batch'
import type { ProviderModel } from '@/types/api/provider-models'
import type { ChatMessageAPI } from '@/types/api/chat-batch'
import { AI_MODELS } from '../config/ai-models'

export interface StreamChunk {
  content: string
}

export abstract class BaseAIProvider {
  public readonly type: AIProviderType
  protected constructor(type: AIProviderType) {
    this.type = type
  }

  abstract chat(request: ModelChat): Promise<string>
  abstract streamChat(messages: ChatMessageAPI[], model: string, options?: { temperature?: number; maxTokens?: number }): AsyncGenerator<StreamChunk>
  getModels(): ProviderModel[] {
    return AI_MODELS[this.type] || []
  }
}


