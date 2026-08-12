import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { ensureAbastecimentoTables } from "@/lib/abastecimento"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureAbastecimentoTables()

    const { id } = await params
    const documentoId = Number(id)

    if (!documentoId || Number.isNaN(documentoId)) {
      return NextResponse.json({ error: "ID de documento inválido" }, { status: 400 })
    }

    const alocacoes = await sql`
      SELECT a.id, a.valor, a.created_at,
        c.id as credito_id, TO_CHAR(c.data_credito, 'YYYY-MM-DD') as credito_data,
        c.observacao as credito_observacao
      FROM abastecimento_alocacoes a
      JOIN abastecimento_creditos c ON a.credito_id = c.id
      WHERE a.documento_id = ${documentoId}
      ORDER BY c.data_credito ASC, a.id ASC
    `

    const alocacoesFormatadas = alocacoes.map((a) => ({
      ...a,
      valor: Number(a.valor),
    }))

    return NextResponse.json(alocacoesFormatadas)
  } catch (error) {
    console.error("Erro ao buscar alocações do documento:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
