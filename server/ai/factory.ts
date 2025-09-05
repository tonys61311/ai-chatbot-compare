import { BaseAIProvider } from './base'
import { AIProviderType, ALL_AI_PROVIDERS } from '@/types/ai'
import { DeepseekProvider, GeminiProvider, OpenAIProvider } from './providers'

const config = useRuntimeConfig()

export const providersMap: Record<AIProviderType, BaseAIProvider> = {
  [AIProviderType.OpenAI]: new OpenAIProvider(config.openaiKey || ''),
  [AIProviderType.Gemini]: new GeminiProvider(config.geminiKey || ''),
  [AIProviderType.DeepSeek]: new DeepseekProvider(config.deepseekKey || '')
}

export function getProvider(type: AIProviderType): BaseAIProvider {
  const p = providersMap[type]
  if (!p) throw createError({ statusCode: 400, statusMessage: `Unknown provider: ${type}` })
  return p
}

export function getAllProviders(): BaseAIProvider[] {
  return ALL_AI_PROVIDERS.map(t => providersMap[t]).filter(Boolean)
}


