import type { NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface AuthenticatedUser {
  id: number
  username: string
  nome: string
  tipo: "admin" | "usuario"
  ativo: boolean
}

// Extrai e valida token da requisição
export async function validateApiRequest(
  request: NextRequest,
  requireAdmin = false,
): Promise<{ user: AuthenticatedUser } | { error: string; status: number }> {
  try {
    // Verifica cabeçalho de autenticação
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { error: "Token de autenticação não fornecido", status: 401 }
    }

    const token = authHeader.substring(7)

    // Decodifica token (formato simples: base64 de username:timestamp)
    let decoded: { username: string; timestamp: number }
    try {
      decoded = JSON.parse(Buffer.from(token, "base64").toString())
    } catch {
      return { error: "Token inválido", status: 401 }
    }

    // Verifica se token não expirou (24 horas)
    const tokenAge = Date.now() - decoded.timestamp
    if (tokenAge > 24 * 60 * 60 * 1000) {
      return { error: "Token expirado", status: 401 }
    }

    // Busca usuário no banco
    const users = await sql`
      SELECT id, username, nome, tipo, ativo
      FROM usuarios
      WHERE username = ${decoded.username} AND ativo = true
    `

    if (users.length === 0) {
      return { error: "Usuário não encontrado ou inativo", status: 401 }
    }

    const user = users[0] as AuthenticatedUser

    // Verifica se precisa ser admin
    if (requireAdmin && user.tipo !== "admin") {
      return { error: "Acesso negado: privilégios de administrador necessários", status: 403 }
    }

    return { user }
  } catch (error) {
    console.error("Erro na validação de API:", error)
    return { error: "Erro ao validar autenticação", status: 500 }
  }
}

// Helper para criar token
export function createAuthToken(username: string): string {
  const payload = {
    username,
    timestamp: Date.now(),
  }
  return Buffer.from(JSON.stringify(payload)).toString("base64")
}
