import { AIProviderType } from '@/types/ai'

export abstract class BaseAIProviderUI {
  public readonly type: AIProviderType

  constructor(type: AIProviderType) {
    this.type = type
  }

  abstract getTitle(): string
}


