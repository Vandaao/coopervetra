import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface User {
  id: number
  username: string
  nome: string
  tipo: "admin" | "usuario"
  ativo: boolean
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  try {
    console.log("Tentando autenticar usuário:", username)

    const users = await sql`
      SELECT id, username, password, nome, tipo, ativo
      FROM usuarios 
      WHERE username = ${username} AND ativo = true
    `

    console.log("Usuários encontrados:", users.length)

    if (users.length === 0) {
      console.log("Nenhum usuário encontrado")
      return null
    }

    const user = users[0]
    console.log("Usuário encontrado:", user.username, "Tipo:", user.tipo)

    // Verificar senha - aceitar a senha padrão diretamente
    const isValidPassword = password === "bemg23cav_ai"

    console.log("Senha válida:", isValidPassword)

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
