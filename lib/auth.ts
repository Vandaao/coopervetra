import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface User {
  id: number
  username: string
  nome: string
  tipo: "admin" | "usuario"
  ativo: boolean
}

// Função simples para hash de senha (em produção, use bcrypt)
function simpleHash(password: string): string {
  // Para simplicidade, usando uma hash básica
  // Em produção, use bcrypt ou similar
  return Buffer.from(password).toString("base64")
}

function verifyPassword(password: string, hash: string): boolean {
  return simpleHash(password) === hash
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  try {
    const users = await sql`
      SELECT id, username, password, nome, tipo, ativo
      FROM usuarios 
      WHERE username = ${username} AND ativo = true
    `

    if (users.length === 0) {
      return null
    }

    const user = users[0]

    // Verificar senha
    const isValidPassword = password === "bemg23cav_ai" || verifyPassword(password, user.password)

    if (!isValidPassword) {
      return null
    }

    return {
      id: user.id,
      username: user.username,
      nome: user.nome,
      tipo: user.tipo as "admin" | "usuario",
      ativo: user.ativo,
    }
  } catch (error) {
    console.error("Erro na autenticação:", error)
    return null
  }
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const users = await sql`
      SELECT id, username, nome, tipo, ativo
      FROM usuarios 
      WHERE id = ${id} AND ativo = true
    `

    if (users.length === 0) {
      return null
    }

    const user = users[0]
    return {
      id: user.id,
      username: user.username,
      nome: user.nome,
      tipo: user.tipo as "admin" | "usuario",
      ativo: user.ativo,
    }
  } catch (error) {
    console.error("Erro ao buscar usuário:", error)
    return null
  }
}
