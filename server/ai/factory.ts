import { BaseAIProvider } from './base'
import { AIProviderType, ALL_AI_PROVIDERS } from '@/types/ai'
import { DeepseekProvider, GeminiProvider, OpenAIProvider } from './providers'

const providersMap: Partial<Record<AIProviderType, BaseAIProvider>> = {}

export function getProvider(type: AIProviderType): BaseAIProvider {
  if (!providersMap[type]) {
    const config = useRuntimeConfig()
    if (type === AIProviderType.OpenAI) {
      providersMap[type] = new OpenAIProvider(config.openaiKey || '')
    } else if (type === AIProviderType.Gemini) {
      providersMap[type] = new GeminiProvider(config.geminiKey || '')
    } else if (type === AIProviderType.DeepSeek) {
      providersMap[type] = new DeepseekProvider(config.deepseekKey || '')
    } else {
      throw createError({ statusCode: 400, statusMessage: `Unknown provider: ${type}` })
    }
  }
  return providersMap[type] as BaseAIProvider
}

export function getAllProviders(): BaseAIProvider[] {
  return ALL_AI_PROVIDERS.map(t => getProvider(t)).filter(Boolean)
}


