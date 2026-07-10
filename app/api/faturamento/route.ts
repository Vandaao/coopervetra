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
        SELECT f.*, c.nome as cliente FROM faturamento f
        LEFT JOIN clientes c ON f.cliente_id = c.id
        WHERE f.status = ${status}
          AND f.data_emissao >= ${dataInicio}::date
          AND f.data_emissao <= ${dataFim}::date
        ORDER BY f.data_vencimento DESC
      `
    } else if (status && dataInicio) {
      result = await sql`
        SELECT f.*, c.nome as cliente FROM faturamento f
        LEFT JOIN clientes c ON f.cliente_id = c.id
        WHERE f.status = ${status}
          AND f.data_emissao >= ${dataInicio}::date
        ORDER BY f.data_vencimento DESC
      `
    } else if (status && dataFim) {
      result = await sql`
        SELECT f.*, c.nome as cliente FROM faturamento f
        LEFT JOIN clientes c ON f.cliente_id = c.id
        WHERE f.status = ${status}
          AND f.data_emissao <= ${dataFim}::date
        ORDER BY f.data_vencimento DESC
      `
    } else if (status) {
      result = await sql`
        SELECT f.*, c.nome as cliente FROM faturamento f
        LEFT JOIN clientes c ON f.cliente_id = c.id
        WHERE f.status = ${status}
        ORDER BY f.data_vencimento DESC
      `
    } else if (dataInicio && dataFim) {
      result = await sql`
        SELECT f.*, c.nome as cliente FROM faturamento f
        LEFT JOIN clientes c ON f.cliente_id = c.id
        WHERE f.data_emissao >= ${dataInicio}::date
          AND f.data_emissao <= ${dataFim}::date
        ORDER BY f.data_vencimento DESC
      `
    } else if (dataInicio) {
      result = await sql`
        SELECT f.*, c.nome as cliente FROM faturamento f
        LEFT JOIN clientes c ON f.cliente_id = c.id
        WHERE f.data_emissao >= ${dataInicio}::date
        ORDER BY f.data_vencimento DESC
      `
    } else if (dataFim) {
      result = await sql`
        SELECT f.*, c.nome as cliente FROM faturamento f
        LEFT JOIN clientes c ON f.cliente_id = c.id
        WHERE f.data_emissao <= ${dataFim}::date
        ORDER BY f.data_vencimento DESC
      `
    } else {
      result = await sql`
        SELECT f.*, c.nome as cliente FROM faturamento f
        LEFT JOIN clientes c ON f.cliente_id = c.id
        ORDER BY f.data_vencimento DESC
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
    const { cliente_id, documento_referencia, data_emissao, data_vencimento, valor, observacao } = body

    if (!cliente_id || !data_emissao || !data_vencimento || !valor) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 },
      )
    }

    const result = await sql`
      INSERT INTO faturamento (cliente_id, documento_referencia, data_emissao, data_vencimento, valor, observacao)
      VALUES (${Number(cliente_id)}, ${documento_referencia}, ${data_emissao}, ${data_vencimento}, ${valor}, ${observacao || null})
      RETURNING f.id, c.nome as cliente, f.documento_referencia, f.data_emissao, f.data_vencimento, f.valor, f.status, f.observacao, f.created_at, f.cliente_id
      FROM faturamento f
      LEFT JOIN clientes c ON f.cliente_id = c.id
      WHERE f.id = (SELECT MAX(id) FROM faturamento)
    `

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Erro ao criar faturamento:", error)
    return NextResponse.json({ error: "Erro ao criar faturamento" }, { status: 500 })
  }
}
