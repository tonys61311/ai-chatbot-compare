import { runChat } from '../ai/adapter'
import type { ChatRequest, ChatResult } from '../ai/base'
import { AIProviderType, ALL_AI_PROVIDERS } from '@/types/ai'
import type { H3Event } from 'h3'

interface CompareRequest { prompt: string; providers?: AIProviderType[] }

// very simple in-memory rate limit and cache (per process)
const requestCounts = new Map<string, { count: number; resetAt: number }>()
const responseCache = new Map<string, { data: any; expireAt: number }>()

function ipOf(event: H3Event) {
  // h3/nitro common header keys
  const xff = getHeader(event, 'x-forwarded-for')
  return (xff?.split(',')[0]?.trim()) || event.context.clientAddress || 'unknown'
}

export default defineEventHandler(async (event) => {
  const { prompt, providers } = await readBody<CompareRequest>(event)
  if (!prompt) throw createError({ statusCode: 400, statusMessage: 'prompt is required' })

  const key = `${ipOf(event)}:${prompt}`
  const now = Date.now()

  // rate limit: 20 requests per 60s per IP
  const windowMs = 60_000
  const limit = 20
  const rec = requestCounts.get(key)
  if (!rec || rec.resetAt < now) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs })
  } else {
    rec.count += 1
    if (rec.count > limit) {
      throw createError({ statusCode: 429, statusMessage: 'Too Many Requests' })
    }
  }

  // cache: 15s per prompt
  const cacheKey = `compare:${prompt}:${(providers || []).join(',')}`
  const cached = responseCache.get(cacheKey)
  if (cached && cached.expireAt > now) {
    return cached.data
  }

  const usedProviders: AIProviderType[] = providers && providers.length
    ? providers
    : ALL_AI_PROVIDERS

  const messages: ChatRequest['messages'] = [
    { role: 'user', content: prompt }
  ]

  const results = await Promise.all(usedProviders.map(p => runChat(p, { messages })))

  const data = { results: results as ChatResult[] }
  responseCache.set(cacheKey, { data, expireAt: now + 15_000 })
  return data
})
