import { getOrInitUsage } from '../utils/usage-store'
import { defaultLimit } from '../config/ai-models'
import { getClientIPNormalized } from '../utils/ip'

export default defineEventHandler(async (event) => {
  const ip = getClientIPNormalized(event)
  const record = getOrInitUsage(ip, defaultLimit)
  return { used: record.used, limit: record.limit }
})