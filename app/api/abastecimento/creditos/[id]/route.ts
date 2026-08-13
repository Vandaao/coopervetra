import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { ensureAbastecimentoTables } from "@/lib/abastecimento"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

const sql = neon(process.env.DATABASE_URL!)

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureAbastecimentoTables()
    const { id: idParam } = await params
    const creditoId = Number(idParam)

    if (!Number.isInteger(creditoId) || creditoId <= 0) {
      return NextResponse.json({ error: "ID de crédito inválido" }, { status: 400 })
    }

    const credito = await sql`
      SELECT id, valor FROM abastecimento_creditos WHERE id = ${creditoId}
    `

    if (credito.length === 0) {
      return NextResponse.json({ error: "Crédito não encontrado" }, { status: 404 })
    }

    const documentosRelacionados = await sql`
      SELECT DISTINCT documento_id
      FROM abastecimento_alocacoes
      WHERE credito_id = ${creditoId}
    `
    const documentoIds = documentosRelacionados.map((item) => Number(item.documento_id))

    const restauracoes = await sql`
      SELECT credito_id, COALESCE(SUM(valor), 0) AS valor
      FROM abastecimento_alocacoes
      WHERE documento_id = ANY(${documentoIds.length ? documentoIds : [0]}::int[])
        AND credito_id <> ${creditoId}
      GROUP BY credito_id
    `

    for (const item of restauracoes) {
      await sql`
        UPDATE abastecimento_creditos
        SET saldo_disponivel = saldo_disponivel + ${Number(item.valor)}
        WHERE id = ${Number(item.credito_id)}
      `
    }

    if (documentoIds.length > 0) {
      await sql`DELETE FROM abastecimento_documentos WHERE id = ANY(${documentoIds}::int[])`
    }

    await sql`DELETE FROM abastecimento_creditos WHERE id = ${creditoId}`

    return NextResponse.json({
      message: "Crédito e lançamentos relacionados excluídos com sucesso",
      documentos_excluidos: documentoIds.length,
    })
  } catch (error) {
    console.error("Erro ao excluir crédito de abastecimento:", error)
    return NextResponse.json({ error: "Erro interno do servidor ao excluir crédito" }, { status: 500 })
  }
}
