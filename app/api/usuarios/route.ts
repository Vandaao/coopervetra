import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { hashPassword } from "@/lib/crypto"
import { validateUsername, validatePassword, sanitizeString } from "@/lib/input-validation"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

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

    const usernameValidation = validateUsername(username)
    if (!usernameValidation.valid) {
      return NextResponse.json({ error: usernameValidation.error }, { status: 400 })
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.error }, { status: 400 })
    }

    if (!nome || nome.trim().length < 3) {
      return NextResponse.json({ error: "Nome deve ter pelo menos 3 caracteres" }, { status: 400 })
    }

    if (!["admin", "usuario"].includes(tipo)) {
      return NextResponse.json({ error: "Tipo de usuário inválido" }, { status: 400 })
    }

    const sanitizedUsername = sanitizeString(username, 50)
    const sanitizedNome = sanitizeString(nome, 255)

    const hashedPassword = await hashPassword(password)

    const result = await sql`
      INSERT INTO usuarios (username, password, nome, tipo, ativo)
      VALUES (${sanitizedUsername}, ${hashedPassword}, ${sanitizedNome}, ${tipo}, true)
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
