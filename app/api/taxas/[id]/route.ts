import { sql } from "@vercel/postgres"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { nome, percentual, descricao, ativo } = body

    const result = await sql`
      UPDATE taxas_descontos
      SET
        nome = COALESCE(${nome || null}, nome),
        percentual = COALESCE(${percentual !== undefined ? percentual : null}, percentual),
        descricao = COALESCE(${descricao || null}, descricao),
        ativo = COALESCE(${ativo !== undefined ? ativo : null}, ativo),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${Number(id)}
      RETURNING *
    `

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Taxa não encontrada" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Erro ao atualizar taxa:", error)
    return NextResponse.json({ error: "Erro ao atualizar taxa" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    await sql`
      UPDATE taxas_descontos
      SET ativo = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${Number(id)}
    `

    return NextResponse.json({ message: "Taxa desativada com sucesso" })
  } catch (error) {
    console.error("Erro ao deletar taxa:", error)
    return NextResponse.json({ error: "Erro ao deletar taxa" }, { status: 500 })
  }
}
