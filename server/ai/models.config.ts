import { AIProviderType, type ProviderModel } from '@/types/ai'

export const PROVIDER_MODELS: Record<AIProviderType, ProviderModel[]> = {
  [AIProviderType.OpenAI]: [
    { id: 'gpt-4o-mini', label: 'GPT-4o mini', default: true, limits: { maxTokens: 16384 } }
  ],
  [AIProviderType.Gemini]: [
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', default: true }
  ],
  [AIProviderType.DeepSeek]: [
    { id: 'deepseek-chat', label: 'DeepSeek Chat', default: true }
  ]
}


