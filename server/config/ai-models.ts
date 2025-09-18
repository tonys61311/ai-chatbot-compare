import { AIProviderType } from '@/types/ai'
import type { ProviderModel } from '@/types/ai'

export const AI_MODELS: Record<AIProviderType, ProviderModel[]> = {
  [AIProviderType.OpenAI]: [
    { id: 'gpt-4o-mini', label: 'GPT-4o mini', default: true, limits: { maxTokens: 16384 } },
    { id: 'gpt-4o', label: 'GPT-4o', limits: { maxTokens: 128000 } }
  ],
  [AIProviderType.Gemini]: [
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', default: true, limits: { maxTokens: 1000000 } },
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', limits: { maxTokens: 2000000 } }
  ],
  [AIProviderType.DeepSeek]: [
    { id: 'deepseek-chat', label: 'DeepSeek Chat', default: true, limits: { maxTokens: 32768 } },
    { id: 'deepseek-coder', label: 'DeepSeek Coder', limits: { maxTokens: 16384 } }
  ]
}
