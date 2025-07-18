import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Função simples para hash de senha
function simpleHash(password: string): string {
  return Buffer.from(password).toString("base64")
}

export async function GET() {
  try {
    const usuarios = await sql`
      SELECT id, username, nome, tipo, ativo, created_at
      FROM usuarios 
      ORDER BY nome
    `
    return NextResponse.json(usuarios)
  } catch (error) {
    console.error("Erro ao buscar usuários:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username, password, nome, tipo } = await request.json()

    // Hash da senha
    const hashedPassword = simpleHash(password)

    const result = await sql`
      INSERT INTO usuarios (username, password, nome, tipo, ativo)
      VALUES (${username}, ${hashedPassword}, ${nome}, ${tipo}, true)
      RETURNING id, username, nome, tipo, ativo, created_at
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Erro ao criar usuário:", error)
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json({ error: "Nome de usuário já existe" }, { status: 400 })
    }
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
