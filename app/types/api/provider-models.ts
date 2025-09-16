import type { AIProviderType } from '@/types/ai'
import type { ApiDataResponse } from '@/types/api'

export type ProviderModelsRequest = {
  providers?: AIProviderType[]
}

export type ProviderModelsResponse = ApiDataResponse<ProviderModels[]>


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