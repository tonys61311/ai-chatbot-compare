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
