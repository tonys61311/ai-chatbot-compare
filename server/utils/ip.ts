export function getClientIPNormalized(event: any): string {
  const xff = getHeader(event, 'x-forwarded-for')
  let ip = xff ? String(xff).split(',')[0].trim() : ''
  if (!ip) {
    // @ts-ignore
    ip = (event.node?.req?.socket?.remoteAddress as string) || ''
  }
  if (!ip) return 'unknown'
  // Normalize common loopback/address formats
  if (ip === '::1') return '127.0.0.1'
  if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '')
  return ip
}

