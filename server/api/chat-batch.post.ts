import { runChat } from '../ai/adapter'
import type { AIProviderType } from '@/types/ai'
import type { ModelChat, ChatResult, ChatBatchResponse, ChatBatchRequest } from '@/types/api/chat-batch'
import { countMessageTokens, estimateMessagesTokens } from '../utils/token-calculator'
import { incrementUsage } from '../utils/usage-store'
import { getClientIPNormalized } from '../utils/ip'

export default defineEventHandler(async (event) => {
  const chats = await readBody<ChatBatchRequest | undefined>(event)

  const list: ModelChat[] = Array.isArray(chats) ? chats : []

  if (list.length === 0) {
    const resp: ChatBatchResponse = { data: [] }
    return resp
  }

  // 不預估 token，讓 API 正常發送
  // 如果超過限制，後續請求會被阻擋
  const ip = getClientIPNormalized(event)

  const results = await Promise.all(
    list.map(async (c) => {
      const safe: ModelChat = {
        provider: c.provider,
        messages: c.messages || [],
        model: c.model || 'gpt-4o-mini',
        temperature: c.temperature || 0.7,
        maxTokens: c.maxTokens || 1000
      }
      return runChat(c.provider, safe)
    })
  )

  // 計算實際使用的完整 token 數（request + response）並更新使用量
  let actualTotalTokens = 0
  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    const chat = list[i]
    if ('text' in result && result.text && chat.model) {
      const requestTokens = estimateMessagesTokens(chat.messages, chat.model)
      const responseTokens = countMessageTokens(result.text, chat.model)
      actualTotalTokens += requestTokens + responseTokens
    }
  }
  
  // 更新使用量
  incrementUsage(ip, actualTotalTokens)

  const resp: ChatBatchResponse = { data: results as ChatResult[] }
  return resp
})