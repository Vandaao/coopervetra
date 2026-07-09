import { sql } from "@vercel/postgres"
import { NextRequest, NextResponse } from "next/server"

// Inicializar tabela se não existir
async function initializeTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS faturamento (
        id SERIAL PRIMARY KEY,
        cliente VARCHAR(255) NOT NULL,
        documento_referencia VARCHAR(50),
        data_emissao DATE NOT NULL,
        data_vencimento DATE NOT NULL,
        valor DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pendente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`CREATE INDEX IF NOT EXISTS idx_faturamento_data_emissao ON faturamento(data_emissao)`
    await sql`CREATE INDEX IF NOT EXISTS idx_faturamento_data_vencimento ON faturamento(data_vencimento)`
    await sql`CREATE INDEX IF NOT EXISTS idx_faturamento_status ON faturamento(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_faturamento_cliente ON faturamento(cliente)`
  } catch (error) {
    console.error("Erro ao inicializar tabela:", error)
  }
}

export async function GET(request: NextRequest) {
  try {
    await initializeTable()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const dataInicio = searchParams.get("dataInicio")
    const dataFim = searchParams.get("dataFim")

    let result

    if (status && dataInicio && dataFim) {
      result = await sql`
        SELECT * FROM faturamento 
        WHERE status = ${status}
          AND data_emissao >= ${dataInicio}::date
          AND data_emissao <= ${dataFim}::date
        ORDER BY data_vencimento DESC
      `
    } else if (status && dataInicio) {
      result = await sql`
        SELECT * FROM faturamento 
        WHERE status = ${status}
          AND data_emissao >= ${dataInicio}::date
        ORDER BY data_vencimento DESC
      `
    } else if (status && dataFim) {
      result = await sql`
        SELECT * FROM faturamento 
        WHERE status = ${status}
          AND data_emissao <= ${dataFim}::date
        ORDER BY data_vencimento DESC
      `
    } else if (status) {
      result = await sql`
        SELECT * FROM faturamento 
        WHERE status = ${status}
        ORDER BY data_vencimento DESC
      `
    } else if (dataInicio && dataFim) {
      result = await sql`
        SELECT * FROM faturamento 
        WHERE data_emissao >= ${dataInicio}::date
          AND data_emissao <= ${dataFim}::date
        ORDER BY data_vencimento DESC
      `
    } else if (dataInicio) {
      result = await sql`
        SELECT * FROM faturamento 
        WHERE data_emissao >= ${dataInicio}::date
        ORDER BY data_vencimento DESC
      `
    } else if (dataFim) {
      result = await sql`
        SELECT * FROM faturamento 
        WHERE data_emissao <= ${dataFim}::date
        ORDER BY data_vencimento DESC
      `
    } else {
      result = await sql`
        SELECT * FROM faturamento 
        ORDER BY data_vencimento DESC
      `
    }

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Erro ao buscar faturamento:", error)
    return NextResponse.json({ error: "Erro ao buscar faturamento" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeTable()
    const body = await request.json()
    const { cliente, documento_referencia, data_emissao, data_vencimento, valor } = body

    if (!cliente || !data_emissao || !data_vencimento || !valor) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 },
      )
    }

    const result = await sql`
      INSERT INTO faturamento (cliente, documento_referencia, data_emissao, data_vencimento, valor)
      VALUES (${cliente}, ${documento_referencia}, ${data_emissao}, ${data_vencimento}, ${valor})
      RETURNING *
    `

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Erro ao criar faturamento:", error)
    return NextResponse.json({ error: "Erro ao criar faturamento" }, { status: 500 })
  }
}
