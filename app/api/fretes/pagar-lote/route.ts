import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { frete_ids, data_pagamento } = await request.json()

    if (!frete_ids || !Array.isArray(frete_ids) || frete_ids.length === 0) {
      return NextResponse.json({ error: "IDs de fretes são obrigatórios" }, { status: 400 })
    }

    if (!data_pagamento) {
      return NextResponse.json({ error: "Data de pagamento é obrigatória" }, { status: 400 })
    }

    console.log("[v0] Processando pagamento em lote:", { count: frete_ids.length, data_pagamento })

    try {
      const checkColumns = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'fretes' 
        AND column_name IN ('status', 'data_pagamento')
      `

      if (checkColumns.length < 2) {
        console.log("[v0] Colunas não encontradas, executando migração...")

        await sql`
          ALTER TABLE fretes 
          ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pendente',
          ADD COLUMN IF NOT EXISTS data_pagamento DATE
        `

        await sql`
          CREATE INDEX IF NOT EXISTS idx_fretes_status ON fretes(status)
        `

        console.log("[v0] Migração executada com sucesso")
      }
    } catch (migrationError) {
      console.error("[v0] Erro na migração:", migrationError)
      return NextResponse.json({ error: "Erro ao preparar banco de dados" }, { status: 500 })
    }

    const result = await sql`
      UPDATE fretes 
      SET status = 'pago', 
          data_pagamento = ${data_pagamento}::date
      WHERE id = ANY(${frete_ids})
        AND (status IS NULL OR status = 'pendente')
      RETURNING id
    `

    console.log("[v0] Fretes atualizados:", result.length)

    return NextResponse.json(
      {
        success: true,
        count: result.length,
        message: `${result.length} frete(s) marcado(s) como pago`,
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Erro ao marcar fretes como pagos:", error)
    return NextResponse.json(
      {
        error: "Erro ao processar pagamento em lote",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
