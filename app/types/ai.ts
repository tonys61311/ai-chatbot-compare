export enum AIProviderType {
  OpenAI = 'openai',
  Gemini = 'gemini',
  DeepSeek = 'deepseek'
}

export const ALL_AI_PROVIDERS: AIProviderType[] = [
  AIProviderType.OpenAI,
  AIProviderType.Gemini,
  AIProviderType.DeepSeek
]

// 供模型下拉使用的型別（前後端共用）
export type ProviderModel = {
  id: string
  label: string
  default?: boolean
  limits?: { maxTokens?: number }
}

export type ProviderModels = {
  type: AIProviderType
  models: ProviderModel[]
}
