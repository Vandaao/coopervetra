import { neon } from "@neondatabase/serverless"
import { NextResponse, NextRequest } from "next/server"
import { format } from "date-fns"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(
  request: NextRequest,
  { params }: { params: { parcelaId: string } },
) {
  try {
    const parcelaId = parseInt(params.parcelaId)

    if (!parcelaId) {
      return NextResponse.json(
        { error: "parcelaId inválido" },
        { status: 400 },
      )
    }

    const body = await request.json()
    const { data_pagamento, observacao } = body

    // Buscar a parcela
    const parcelaResult = await sql`
      SELECT id, debito_id, status FROM debitos_parcelamento
      WHERE id = ${parcelaId}
    `

    if (parcelaResult.length === 0) {
      return NextResponse.json(
        { error: "Parcela não encontrada" },
        { status: 404 },
      )
    }

    const parcela = parcelaResult[0]

    if (parcela.status === "pago") {
      return NextResponse.json(
        { error: "Parcela já foi paga" },
        { status: 400 },
      )
    }

    const dataPagamento = data_pagamento ? format(new Date(data_pagamento), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")

    // Atualizar parcela como paga
    await sql`
      UPDATE debitos_parcelamento
      SET 
        status = 'pago',
        data_pagamento = ${dataPagamento},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${parcelaId}
    `

    // Verificar se todas as parcelas foram pagas
    const todasParcelas = await sql`
      SELECT COUNT(*) as total, 
             SUM(CASE WHEN status = 'pago' THEN 1 ELSE 0 END) as pagas
      FROM debitos_parcelamento
      WHERE debito_id = ${parcela.debito_id}
    `

    const { total, pagas } = todasParcelas[0]

    // Se todas as parcelas foram pagas, marcar o débito como pago
    if (total === pagas) {
      await sql`
        UPDATE debitos
        SET 
          status = 'pago',
          data_baixa = ${dataPagamento},
          observacao_baixa = 'Débito parcelado pago completamente'
        WHERE id = ${parcela.debito_id}
      `
    }

    return NextResponse.json({
      success: true,
      parcela_id: parcelaId,
      status: "pago",
      data_pagamento: dataPagamento,
      todas_pagas: total === pagas,
      message: total === pagas 
        ? "Parcela paga! Débito completamente quitado."
        : `Parcela paga! ${pagas}/${total} parcelas pagas.`,
    })
  } catch (error) {
    console.error("Erro ao pagar parcela:", error)
    return NextResponse.json(
      {
        error: "Erro ao pagar parcela",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
