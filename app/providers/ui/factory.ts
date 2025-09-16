import { BaseAIProviderUI } from './base'
import { OpenAIProviderUI, GeminiProviderUI, DeepseekProviderUI } from './providers'

export function createAllProviderUIs(): BaseAIProviderUI[] {
  return [
    new OpenAIProviderUI(),
    new GeminiProviderUI(),
    new DeepseekProviderUI()
  ]
}


