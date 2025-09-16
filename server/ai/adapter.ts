import { AIProviderType } from '@/types/ai'
import type { ModelChat, ChatResult } from '@/types/api/chat-batch'
import { getProvider } from './factory'

export async function runChat(type: AIProviderType, request: ModelChat): Promise<ChatResult> {
  const provider = getProvider(type)
  const start = Date.now()
  try {
    const text = await provider.chat(request)
    return { provider: type, text, elapsedMs: Date.now() - start }
  } catch (err: any) {
    const message = err?.message || 'Unknown error'
    return { provider: type, error: message, elapsedMs: Date.now() - start }
  }
}


