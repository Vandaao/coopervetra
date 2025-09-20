import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const { cooperado_id, empresa_id, carga, km, valor, chapada, data } = await request.json()

    const result = await sql`
      UPDATE fretes 
      SET cooperado_id = ${cooperado_id}, 
          empresa_id = ${empresa_id}, 
          carga = ${carga}, 
          km = ${km}, 
          valor = ${valor}, 
          chapada = ${chapada}, 
          data = ${data}::date
      WHERE id = ${id}
      RETURNING id, cooperado_id, empresa_id, carga, km, valor, chapada, TO_CHAR(data, 'YYYY-MM-DD') as data
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Frete não encontrado" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Erro ao atualizar frete:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    await sql`
      DELETE FROM fretes 
      WHERE id = ${id}
    `

    return NextResponse.json({ message: "Frete excluído com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir frete:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
