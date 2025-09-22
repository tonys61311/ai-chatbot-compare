import type { ChatStreamRequest, ChatStreamChunk } from '@/types/api/chat-stream'
import { getProvider } from '../ai/factory'
import { getOrInitUsage, incrementUsage } from '../utils/usage-store'
import { getClientIPNormalized } from '../utils/ip'
import { defaultLimit } from '../config/ai-models'
import { countMessageTokens, estimateMessagesTokens } from '../utils/token-calculator'

export default defineEventHandler(async (event) => {
  const body = await readBody<ChatStreamRequest>(event)
  
  if (!body || !body.provider || !body.messages || !body.model) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request body: provider, messages, and model are required'
    })
  }

  try {
    // Rate limit by IP
    const ip = getClientIPNormalized(event)
    const record = getOrInitUsage(ip, defaultLimit)
    // 檢查是否超過限制
    if (record.used >= record.limit) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Usage limit exceeded'
      })
    }

    const provider = getProvider(body.provider)
    
    // Set response headers for Server-Sent Events
    setHeader(event, 'Content-Type', 'text/event-stream')
    setHeader(event, 'Cache-Control', 'no-cache')
    setHeader(event, 'Connection', 'keep-alive')
    setHeader(event, 'Access-Control-Allow-Origin', '*')
    setHeader(event, 'Access-Control-Allow-Headers', 'Cache-Control')

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        let actualResponse = ''
        
        try {
          const startTime = Date.now()
          
          for await (const chunk of provider.streamChat(body.messages, body.model, {
            temperature: body.temperature,
            maxTokens: body.maxTokens
          })) {
            actualResponse += chunk.content || ''
            
            const streamChunk: ChatStreamChunk = {
              provider: body.provider,
              type: 'content',
              content: chunk.content
            }
            
            const data = `data: ${JSON.stringify(streamChunk)}\n\n`
            controller.enqueue(encoder.encode(data))
          }
          
          // 計算實際使用的完整 token 數（request + response）
          const requestTokens = estimateMessagesTokens(body.messages, body.model)
          const responseTokens = countMessageTokens(actualResponse, body.model)
          const actualTotalTokens = requestTokens + responseTokens
          
          incrementUsage(ip, actualTotalTokens)
          
          const latest = getOrInitUsage(ip, defaultLimit)

          const doneChunk: ChatStreamChunk = {
            provider: body.provider,
            type: 'done',
            elapsedMs: Date.now() - startTime,
            usage: {
              used: latest.used,
              limit: latest.limit,
              remaining: Math.max(0, latest.limit - latest.used)
            }
          }

          const doneData = `data: ${JSON.stringify(doneChunk)}\n\n`
          controller.enqueue(encoder.encode(doneData))
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error: any) {
          // Send error chunk
          const errorChunk: ChatStreamChunk = {
            provider: body.provider,
            type: 'error',
            error: error.message || 'Unknown error'
          }
          
          const errorData = `data: ${JSON.stringify(errorChunk)}\n\n`
          controller.enqueue(encoder.encode(errorData))
          controller.close()
        }
      }
    })

    return stream
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error'
    })
  }
})