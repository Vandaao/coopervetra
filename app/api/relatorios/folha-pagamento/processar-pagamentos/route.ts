import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export async function POST(request: Request) {
  try {
    const { empresa_id, data_inicio, data_fim, cooperados_ids } = await request.json()

    if (!empresa_id || !data_inicio || !data_fim || !cooperados_ids || cooperados_ids.length === 0) {
      return Response.json({ error: "Parâmetros inválidos" }, { status: 400 })
    }

    const sql = neon(process.env.DATABASE_URL!)

    try {
      await sql`SELECT status FROM fretes LIMIT 1`
    } catch (error: any) {
      if (error.message?.includes("column") && error.message?.includes("status")) {
        console.log("Executando migração de fretes...")
        await sql`ALTER TABLE fretes ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pendente'`
        await sql`ALTER TABLE fretes ADD COLUMN IF NOT EXISTS data_pagamento DATE`
        await sql`CREATE INDEX IF NOT EXISTS idx_fretes_status ON fretes(status)`
        await sql`UPDATE fretes SET status = 'pendente' WHERE status IS NULL`
      }
    }

    try {
      await sql`SELECT status FROM debitos LIMIT 1`
    } catch (error: any) {
      if (error.message?.includes("column") && error.message?.includes("status")) {
        console.log("Executando migração de débitos...")
        await sql`ALTER TABLE debitos ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pendente'`
        await sql`ALTER TABLE debitos ADD COLUMN IF NOT EXISTS data_pagamento DATE`
        await sql`CREATE INDEX IF NOT EXISTS idx_debitos_status ON debitos(status)`
        await sql`UPDATE debitos SET status = 'pendente' WHERE status IS NULL`
      }
    }

    const dataPagamento = new Date().toISOString().split("T")[0]

    // Atualizar fretes
    const fretesResult = await sql`
      UPDATE fretes
      SET status = 'pago', data_pagamento = ${dataPagamento}
      WHERE cooperado_id = ANY(${cooperados_ids})
        AND empresa_id = ${empresa_id}
        AND data >= ${data_inicio}
        AND data <= ${data_fim}
        AND (status IS NULL OR status = 'pendente')
      RETURNING id
    `

    // Atualizar débitos
    const debitosResult = await sql`
      UPDATE debitos
      SET status = 'pago', data_pagamento = ${dataPagamento}
      WHERE cooperado_id = ANY(${cooperados_ids})
        AND data >= ${data_inicio}
        AND data <= ${data_fim}
        AND (status IS NULL OR status = 'pendente')
      RETURNING id
    `

    return Response.json(
      {
        success: true,
        fretes_pagos: fretesResult.length,
        debitos_pagos: debitosResult.length,
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    console.error("Erro ao processar pagamentos:", error)
    return Response.json({ error: "Erro ao processar pagamentos" }, { status: 500 })
  }
}
