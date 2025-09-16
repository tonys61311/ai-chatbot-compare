import { BaseAIProviderUI } from './base'
import { AIProviderType } from '@/types/ai'

export class OpenAIProviderUI extends BaseAIProviderUI {
  constructor() {
    super(AIProviderType.OpenAI)
  }

  getTitle(): string {
    return 'ChatGPT'
  }
}

export class GeminiProviderUI extends BaseAIProviderUI {
  constructor() {
    super(AIProviderType.Gemini)
  }

  getTitle(): string {
    return 'Gemini'
  }
}

export class DeepseekProviderUI extends BaseAIProviderUI {
  constructor() {
    super(AIProviderType.DeepSeek)
  }

  getTitle(): string {
    return 'DeepSeek'
  }
}


