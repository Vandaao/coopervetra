import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const { data_pagamento } = await request.json()

    console.log("[v0] Marcando frete como pago:", { id, data_pagamento })

    if (!data_pagamento) {
      return NextResponse.json({ error: "Data de pagamento é obrigatória" }, { status: 400 })
    }

    // Verificar se as colunas existem, se não, executar migração
    try {
      const checkColumns = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'fretes' 
        AND column_name IN ('status', 'data_pagamento')
      `

      if (checkColumns.length < 2) {
        console.log("[v0] Colunas não encontradas, executando migração...")

        // Executar migração
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
      return NextResponse.json(
        { error: "Erro ao preparar banco de dados. Por favor, execute o script de migração." },
        { status: 500 },
      )
    }

    // Atualizar o frete
    const result = await sql`
      UPDATE fretes 
      SET status = 'pago',
          data_pagamento = ${data_pagamento}::date
      WHERE id = ${id}
      RETURNING id, status, TO_CHAR(data_pagamento, 'YYYY-MM-DD') as data_pagamento
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Frete não encontrado" }, { status: 404 })
    }

    console.log("[v0] Frete marcado como pago:", result[0])

    return NextResponse.json(result[0], {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    })
  } catch (error) {
    console.error("[v0] Erro ao marcar frete como pago:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
