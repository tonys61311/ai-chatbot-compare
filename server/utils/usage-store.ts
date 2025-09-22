export type UsageRecord = { used: number; limit: number }

// in-memory 後備儲存（本機開發或無 storage 時使用）
export const USAGE_STORE: Map<string, UsageRecord> = new Map()

function getKey(ip: string): string {
    return `rate:usage:${ip}`
}

export function getOrInitUsage(ip: string, defaultLimit = 1000): UsageRecord {
    // fallback
    const existing = USAGE_STORE.get(ip)
    if (existing) return existing
    const fresh: UsageRecord = { used: 0, limit: defaultLimit }
    USAGE_STORE.set(ip, fresh)
    return fresh
}

export function setUsage(ip: string, record: UsageRecord): void {
    USAGE_STORE.set(ip, record)
}

export function incrementUsage(ip: string, delta: number): UsageRecord {
    const current = getOrInitUsage(ip)
    current.used += Math.max(0, Math.floor(delta))
    setUsage(ip, current)
    return current
}

