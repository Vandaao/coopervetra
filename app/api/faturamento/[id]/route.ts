import { sql } from "@vercel/postgres"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params
    const body = await request.json()
    const { cliente, documento_referencia, data_emissao, data_vencimento, valor, status } = body

    const result = await sql`
      UPDATE faturamento
      SET 
        cliente = COALESCE(${cliente || null}, cliente),
        documento_referencia = COALESCE(${documento_referencia || null}, documento_referencia),
        data_emissao = COALESCE(${data_emissao || null}, data_emissao),
        data_vencimento = COALESCE(${data_vencimento || null}, data_vencimento),
        valor = COALESCE(${valor || null}, valor),
        status = COALESCE(${status || null}, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Faturamento não encontrado" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Erro ao atualizar faturamento:", error)
    return NextResponse.json({ error: "Erro ao atualizar faturamento" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params

    const result = await sql`
      DELETE FROM faturamento
      WHERE id = ${id}
      RETURNING *
    `

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Faturamento não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ message: "Faturamento deletado com sucesso" })
  } catch (error) {
    console.error("Erro ao deletar faturamento:", error)
    return NextResponse.json({ error: "Erro ao deletar faturamento" }, { status: 500 })
  }
}
