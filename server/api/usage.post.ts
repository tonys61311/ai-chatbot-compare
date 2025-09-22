import { getOrInitUsage } from '../utils/usage-store'
import { defaultLimit } from '../config/ai-models'

function getClientIPNormalized(event: any): string {
  // @ts-ignore
  return (event.node?.req?.socket?.remoteAddress as string) || 'unknown'
}

export default defineEventHandler(async (event) => {
  const ip = getClientIPNormalized(event)
  const record = getOrInitUsage(ip, defaultLimit)
  return { used: record.used, limit: record.limit }
})