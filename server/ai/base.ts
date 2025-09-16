import type { AIProviderType, ChatRequest } from '@/types/ai'
import type { ProviderModel } from '@/types/ai'
import { PROVIDER_MODELS } from './models.config'

export abstract class BaseAIProvider {
  public readonly type: AIProviderType
  protected constructor(type: AIProviderType) {
    this.type = type
  }

  abstract chat(request: ChatRequest): Promise<string>
  getModels(): ProviderModel[] {
    return PROVIDER_MODELS[this.type] || []
  }
}


