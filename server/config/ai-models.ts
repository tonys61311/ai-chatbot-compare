import { AIProviderType } from '@/types/ai'
import type { ProviderModel } from '@/types/ai'

// 預設使用量上限（可依環境調整/注入）
// 設定為 10,000 tokens，大約等於 5,000-7,000 個中文字或 7,000-8,000 個英文單字
export const defaultLimit = 10000

export const AI_MODELS: Record<AIProviderType, ProviderModel[]> = {
  [AIProviderType.OpenAI]: [
    { id: 'gpt-4o-mini', label: 'GPT-4o mini', default: true, limits: { maxTokens: 16384 }, supportsImages: true },
    { id: 'gpt-4o', label: 'GPT-4o', limits: { maxTokens: 128000 }, supportsImages: true }
  ],
  [AIProviderType.Gemini]: [
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', default: true, limits: { maxTokens: 1000000 }, supportsImages: true },
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', limits: { maxTokens: 2000000 }, supportsImages: true }
  ],
  [AIProviderType.DeepSeek]: [
    { id: 'deepseek-chat', label: 'DeepSeek Chat', default: true, limits: { maxTokens: 32768 }, supportsImages: false },
    { id: 'deepseek-coder', label: 'DeepSeek Coder', limits: { maxTokens: 16384 }, supportsImages: false }
  ]
}
