import type { ProviderModelsRequest, ProviderModelsResponse, ProviderModels } from '@/types/api/provider-models'
import { getProvider } from '../ai/factory'
import type { AIProviderType } from '@/types/ai'

export default defineEventHandler(async (event) => {
  const body = await readBody<ProviderModelsRequest>(event)
  const providers = Array.isArray(body?.providers) ? body.providers! : []
  const data: ProviderModels[] = providers.map((p: AIProviderType) => ({ type: p, models: getProvider(p).getModels() }))
  const resp: ProviderModelsResponse = { data }
  return resp
})


