interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 100, 
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; resetTime?: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)
  
  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired one
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    })
    return { allowed: true, resetTime: now + windowMs }
  }
  
  if (entry.count >= maxRequests) {
    return { allowed: false, resetTime: entry.resetTime }
  }
  
  // Increment count
  entry.count++
  rateLimitStore.set(identifier, entry)
  return { allowed: true, resetTime: entry.resetTime }
}

export function getRateLimitHeaders(resetTime: number) {
  return {
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': Math.max(0, 100 - (rateLimitStore.get('global')?.count || 0)),
    'X-RateLimit-Reset': new Date(resetTime).toISOString()
  }
}