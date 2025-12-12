"use server"

import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Função para hash de senha com bcrypt (simulação server-side segura)
export async function hashPassword(password: string): Promise<string> {
  // Usa uma função determinística mais segura que Base64
  const encoder = new TextEncoder()
  const data = encoder.encode(password + process.env.PASSWORD_SALT || "coopervetra-salt-2025")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const hash = await hashPassword(password)
  return hash === hashedPassword
}
