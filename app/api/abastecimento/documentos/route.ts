import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { ensureAbastecimentoTables, alocarDocumentoNovo } from "@/lib/abastecimento"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    await ensureAbastecimentoTables()

    const documentos = await sql`
      SELECT id, numero_documento, TO_CHAR(data_documento, 'YYYY-MM-DD') as data_documento,
        valor, valor_abatido, valor_pendente, status, descricao, created_at
      FROM abastecimento_documentos
      ORDER BY data_documento DESC, id DESC
    `

    const documentosFormatados = documentos.map((d) => ({
      ...d,
      valor: Number(d.valor),
      valor_abatido: Number(d.valor_abatido),
      valor_pendente: Number(d.valor_pendente),
    }))

    return NextResponse.json(documentosFormatados)
  } catch (error) {
    console.error("Erro ao buscar documentos de abastecimento:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureAbastecimentoTables()

    const { numero_documento, data_documento, valor, descricao } = await request.json()

    if (!numero_documento || !data_documento || !valor || Number(valor) <= 0) {
      return NextResponse.json(
        { error: "Número, data e valor do documento são obrigatórios" },
        { status: 400 },
      )
    }

    const result = await sql`
      INSERT INTO abastecimento_documentos (numero_documento, data_documento, valor, valor_abatido, valor_pendente, status, descricao)
      VALUES (${numero_documento}, ${data_documento}::date, ${valor}, 0, ${valor}, 'pendente', ${descricao || null})
      RETURNING id
    `

    await alocarDocumentoNovo(result[0].id)

    const documentoAtualizado = await sql`
      SELECT id, numero_documento, TO_CHAR(data_documento, 'YYYY-MM-DD') as data_documento,
        valor, valor_abatido, valor_pendente, status, descricao, created_at
      FROM abastecimento_documentos WHERE id = ${result[0].id}
    `

    return NextResponse.json(
      {
        ...documentoAtualizado[0],
        valor: Number(documentoAtualizado[0].valor),
        valor_abatido: Number(documentoAtualizado[0].valor_abatido),
        valor_pendente: Number(documentoAtualizado[0].valor_pendente),
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Erro ao criar documento de abastecimento:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
