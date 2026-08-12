import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { ensureAbastecimentoTables, alocarPendenciasAposNovoCredito } from "@/lib/abastecimento"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    await ensureAbastecimentoTables()

    const creditos = await sql`
      SELECT id, TO_CHAR(data_credito, 'YYYY-MM-DD') as data_credito, valor, saldo_disponivel, observacao, created_at
      FROM abastecimento_creditos
      ORDER BY data_credito DESC, id DESC
    `

    const creditosFormatados = creditos.map((c) => ({
      ...c,
      valor: Number(c.valor),
      saldo_disponivel: Number(c.saldo_disponivel),
    }))

    return NextResponse.json(creditosFormatados)
  } catch (error) {
    console.error("Erro ao buscar créditos de abastecimento:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureAbastecimentoTables()

    const { data_credito, valor, observacao } = await request.json()

    if (!data_credito || !valor || Number(valor) <= 0) {
      return NextResponse.json({ error: "Data e valor do crédito são obrigatórios" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO abastecimento_creditos (data_credito, valor, saldo_disponivel, observacao)
      VALUES (${data_credito}::date, ${valor}, ${valor}, ${observacao || null})
      RETURNING id
    `

    await alocarPendenciasAposNovoCredito()

    const creditoAtualizado = await sql`
      SELECT id, TO_CHAR(data_credito, 'YYYY-MM-DD') as data_credito, valor, saldo_disponivel, observacao, created_at
      FROM abastecimento_creditos WHERE id = ${result[0].id}
    `

    return NextResponse.json(
      {
        ...creditoAtualizado[0],
        valor: Number(creditoAtualizado[0].valor),
        saldo_disponivel: Number(creditoAtualizado[0].saldo_disponivel),
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Erro ao criar crédito de abastecimento:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
