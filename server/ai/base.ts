import type { AIProviderType } from '@/types/ai'
import type { ModelChat } from '@/types/api/chat-batch'
import type { ProviderModel } from '@/types/api/provider-models'
import { PROVIDER_MODELS } from './models.config'

export abstract class BaseAIProvider {
  public readonly type: AIProviderType
  protected constructor(type: AIProviderType) {
    this.type = type
  }

  abstract chat(request: ModelChat): Promise<string>
  getModels(): ProviderModel[] {
    return PROVIDER_MODELS[this.type] || []
  }
}


