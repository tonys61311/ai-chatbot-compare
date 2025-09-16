import type { ApiDataResponse } from '@/types/api'
import type { ChatResult, AIProviderType } from '@/types/ai'

export type CompareRequest = {
  prompt: string
  providers?: AIProviderType[]
}

export type ComparePayload = {
  results: ChatResult[]
}

export type CompareResponse = ApiDataResponse<ComparePayload>


