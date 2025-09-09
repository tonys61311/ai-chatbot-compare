import type { 
  AIProviderType, 
  ChatMessageAPI, 
  ChatRequest, 
  ChatSuccessResult, 
  ChatErrorResult, 
  ChatResult 
} from '@/types/ai'

export abstract class BaseAIProvider {
  public readonly type: AIProviderType
  protected constructor(type: AIProviderType) {
    this.type = type
  }

  abstract chat(request: ChatRequest): Promise<string>
}


