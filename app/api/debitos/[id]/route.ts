import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const { cooperado_id, empresa_id, descricao, data, valor } = await request.json()

    const result = await sql`
      UPDATE debitos 
      SET cooperado_id = ${cooperado_id}, 
          empresa_id = ${empresa_id}, 
          descricao = ${descricao}, 
          data = ${data}::date, 
          valor = ${valor}
      WHERE id = ${id}
      RETURNING id, cooperado_id, empresa_id, descricao, TO_CHAR(data, 'YYYY-MM-DD') as data, valor
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Débito não encontrado" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Erro ao atualizar débito:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    await sql`
      DELETE FROM debitos 
      WHERE id = ${id}
    `

    return NextResponse.json({ message: "Débito excluído com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir débito:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
