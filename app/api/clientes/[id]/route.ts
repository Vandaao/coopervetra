import { sql } from "@vercel/postgres"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params
    const body = await request.json()

    const { nome, cnpj } = body

    if (!nome || !cnpj) {
      return NextResponse.json(
        { error: "Nome e CNPJ são obrigatórios" },
        { status: 400 },
      )
    }

    const result = await sql`
      UPDATE clientes 
      SET nome = ${nome}, 
          cnpj = ${cnpj},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${Number(id)}
      RETURNING *
    `

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error)
    if ((error as any).message?.includes("duplicate")) {
      return NextResponse.json(
        { error: "Este CNPJ já está cadastrado" },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: "Erro ao atualizar cliente" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params

    // Verificar se há faturamentos associados
    const checkResult = await sql`
      SELECT COUNT(*) as count FROM faturamento WHERE cliente_id = ${Number(id)}
    `

    if ((checkResult.rows[0] as any).count > 0) {
      return NextResponse.json(
        { error: "Não é possível deletar um cliente com faturamentos associados" },
        { status: 409 },
      )
    }

    const result = await sql`
      DELETE FROM clientes WHERE id = ${Number(id)}
      RETURNING *
    `

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ message: "Cliente deletado com sucesso" })
  } catch (error) {
    console.error("Erro ao deletar cliente:", error)
    return NextResponse.json({ error: "Erro ao deletar cliente" }, { status: 500 })
  }
}
