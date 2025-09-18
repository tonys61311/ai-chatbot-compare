import { runChat } from '../ai/adapter'
import type { AIProviderType } from '@/types/ai'
import type { ModelChat, ChatResult, ChatBatchResponse, ChatBatchRequest } from '@/types/api/chat-batch'

export default defineEventHandler(async (event) => {
  const chats = await readBody<ChatBatchRequest | undefined>(event)

  const list: ModelChat[] = Array.isArray(chats) ? chats : []

  if (list.length === 0) {
    const empty: ChatBatchResponse = { data: [] }
    return empty
  }

  const results = await Promise.all(
    list.map(async (c) => {
      const provider = c.provider as AIProviderType
      if (!c.model) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Model is required for all chat requests'
        })
      }

      const safe: ModelChat = {
        provider,
        messages: Array.isArray(c.messages) ? c.messages : [],
        model: c.model,
        ...(typeof c.temperature === 'number' ? { temperature: c.temperature } : {}),
        ...(typeof c.maxTokens === 'number' ? { maxTokens: c.maxTokens } : {})
      }
      return runChat(provider, safe)
    })
  )

  const resp: ChatBatchResponse = { data: results as ChatResult[] }
  return resp
})
