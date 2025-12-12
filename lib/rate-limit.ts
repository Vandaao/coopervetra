type RateLimitStore = {
  [key: string]: {
    count: number
    resetTime: number
    blockedUntil?: number
  }
}

const store: RateLimitStore = {}

// Limpa registros antigos a cada 5 minutos
setInterval(
  () => {
    const now = Date.now()
    Object.keys(store).forEach((key) => {
      if (store[key].resetTime < now && !store[key].blockedUntil) {
        delete store[key]
      }
    })
  },
  5 * 60 * 1000,
)

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  blockedUntil?: number
}

export function checkRateLimit(
  identifier: string,
  maxAttempts = 5,
  windowMs: number = 15 * 60 * 1000, // 15 minutos
  blockDurationMs: number = 30 * 60 * 1000, // 30 minutos de bloqueio
): RateLimitResult {
  const now = Date.now()
  const key = `ratelimit:${identifier}`

  // Verifica se está bloqueado
  if (store[key]?.blockedUntil && store[key].blockedUntil! > now) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: store[key].blockedUntil!,
      blockedUntil: store[key].blockedUntil,
    }
  }

  // Inicializa ou reseta janela
  if (!store[key] || store[key].resetTime < now) {
    store[key] = {
      count: 0,
      resetTime: now + windowMs,
    }
  }

  store[key].count++

  // Se excedeu tentativas, bloqueia
  if (store[key].count > maxAttempts) {
    store[key].blockedUntil = now + blockDurationMs
    return {
      allowed: false,
      remaining: 0,
      resetTime: store[key].blockedUntil,
      blockedUntil: store[key].blockedUntil,
    }
  }

  return {
    allowed: store[key].count <= maxAttempts,
    remaining: Math.max(0, maxAttempts - store[key].count),
    resetTime: store[key].resetTime,
  }
}

export function resetRateLimit(identifier: string): void {
  const key = `ratelimit:${identifier}`
  delete store[key]
}
