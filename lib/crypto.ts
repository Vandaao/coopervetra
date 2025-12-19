"use server"

const SALT = process.env.PASSWORD_SALT || "coopervetra-salt-2025-secure"

function isBase64(str: string): boolean {
  return /^[A-Za-z0-9+/]*={0,2}$/.test(str) && str.length % 4 === 0
}

function hashPasswordBase64(password: string): string {
  return Buffer.from(password).toString("base64")
}

function verifyPasswordBase64(password: string, hashedPassword: string): boolean {
  const hash = hashPasswordBase64(password)
  return hash === hashedPassword
}

// Função para hash de senha com SHA-256 e salt (sistema novo)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + SALT)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return hash
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  // Verifica se o hash armazenado é Base64 (sistema antigo)
  if (isBase64(hashedPassword) && hashedPassword.length < 64) {
    console.log("[v0] Detectado hash Base64 (sistema antigo)")
    return verifyPasswordBase64(password, hashedPassword)
  }

  // Caso contrário, usa SHA-256 (sistema novo)
  console.log("[v0] Usando SHA-256 (sistema novo)")
  const hash = await hashPassword(password)
  return hash === hashedPassword
}
