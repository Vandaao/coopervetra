import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { debito_ids, nova_data } = body

    if (!debito_ids || !Array.isArray(debito_ids) || debito_ids.length === 0 || !nova_data) {
      return NextResponse.json({ error: "Parametros obrigatorios: debito_ids e nova_data" }, { status: 400 })
    }

    await sql`
      UPDATE debitos
      SET data = ${nova_data}::date
      WHERE id = ANY(${debito_ids})
    `

    return NextResponse.json({
      success: true,
      atualizados: debito_ids.length,
    })
  } catch (error) {
    console.error("Erro ao alterar data dos debitos:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
