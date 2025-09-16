import type { AIProviderType, ProviderModels } from '@/types/ai'
import type { ApiDataResponse } from '@/types/api'

export type ProviderModelsRequest = {
  providers?: AIProviderType[]
}

export type ProviderModelsResponse = ApiDataResponse<ProviderModels[]>


