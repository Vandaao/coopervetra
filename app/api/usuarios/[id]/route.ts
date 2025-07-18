import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Função simples para hash de senha
function simpleHash(password: string): string {
  return Buffer.from(password).toString("base64")
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const { username, password, nome, tipo, ativo } = await request.json()

    let query
    let values

    if (password) {
      // Se senha foi fornecida, atualizar com nova senha
      const hashedPassword = simpleHash(password)
      query = sql`
        UPDATE usuarios 
        SET username = ${username}, password = ${hashedPassword}, nome = ${nome}, tipo = ${tipo}, ativo = ${ativo}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING id, username, nome, tipo, ativo, created_at, updated_at
      `
    } else {
      // Se senha não foi fornecida, não atualizar senha
      query = sql`
        UPDATE usuarios 
        SET username = ${username}, nome = ${nome}, tipo = ${tipo}, ativo = ${ativo}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING id, username, nome, tipo, ativo, created_at, updated_at
      `
    }

    const result = await query

    if (result.length === 0) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error)
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json({ error: "Nome de usuário já existe" }, { status: 400 })
    }
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    // Verificar se não é o último admin
    const adminCount = await sql`
      SELECT COUNT(*) as count FROM usuarios WHERE tipo = 'admin' AND ativo = true
    `

    const userToDelete = await sql`
      SELECT tipo FROM usuarios WHERE id = ${id}
    `

    if (userToDelete.length > 0 && userToDelete[0].tipo === "admin" && adminCount[0].count <= 1) {
      return NextResponse.json({ error: "Não é possível excluir o último administrador" }, { status: 400 })
    }

    await sql`
      DELETE FROM usuarios 
      WHERE id = ${id}
    `

    return NextResponse.json({ message: "Usuário excluído com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir usuário:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
