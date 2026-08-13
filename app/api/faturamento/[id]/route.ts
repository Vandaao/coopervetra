import { sql } from "@vercel/postgres"
import { NextRequest, NextResponse } from "next/server"

// Inicializar tabela se não existir
async function initializeTable() {
  try {
    // Criar tabela clientes se não existir
    await sql`
      CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        cnpj VARCHAR(20) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Criar tabela faturamento se não existir
    await sql`
      CREATE TABLE IF NOT EXISTS faturamento (
        id SERIAL PRIMARY KEY,
        cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
        documento_referencia VARCHAR(50),
        data_emissao DATE NOT NULL,
        data_vencimento DATE NOT NULL,
        valor DECIMAL(10,2) NOT NULL,
        observacao TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pendente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`CREATE INDEX IF NOT EXISTS idx_faturamento_data_emissao ON faturamento(data_emissao)`
    await sql`CREATE INDEX IF NOT EXISTS idx_faturamento_data_vencimento ON faturamento(data_vencimento)`
    await sql`CREATE INDEX IF NOT EXISTS idx_faturamento_status ON faturamento(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_faturamento_cliente_id ON faturamento(cliente_id)`
  } catch (error) {
    console.error("Erro ao inicializar tabela:", error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await initializeTable()
    const { id } = params
    const body = await request.json()
    const { cliente_id, documento_referencia, data_emissao, data_vencimento, valor, status, observacao, data_pagamento } = body

    if (status === "pago" && (!data_pagamento || !/^\d{4}-\d{2}-\d{2}$/.test(data_pagamento))) {
      return NextResponse.json({ error: "Informe uma data de pagamento válida" }, { status: 400 })
    }

    const result = await sql`
      UPDATE faturamento
      SET 
        cliente_id = COALESCE(${cliente_id ? Number(cliente_id) : null}, cliente_id),
        documento_referencia = COALESCE(${documento_referencia || null}, documento_referencia),
        data_emissao = COALESCE(${data_emissao || null}, data_emissao),
        data_vencimento = COALESCE(${data_vencimento || null}, data_vencimento),
        valor = COALESCE(${valor || null}, valor),
        status = COALESCE(${status || null}, status),
        observacao = COALESCE(${observacao || null}, observacao),
        data_pagamento = COALESCE(${data_pagamento || null}::date, data_pagamento),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${Number(id)}
    `

    const updatedResult = await sql`
      SELECT f.*, c.nome as cliente FROM faturamento f
      LEFT JOIN clientes c ON f.cliente_id = c.id
      WHERE f.id = ${Number(id)}
    `

    if (updatedResult.rows.length === 0) {
      return NextResponse.json({ error: "Faturamento não encontrado" }, { status: 404 })
    }

    return NextResponse.json(updatedResult.rows[0])
  } catch (error) {
    console.error("Erro ao atualizar faturamento:", error)
    return NextResponse.json({ error: "Erro ao atualizar faturamento" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await initializeTable()
    const { id } = params

    const result = await sql`
      DELETE FROM faturamento
      WHERE id = ${id}
      RETURNING *
    `

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Faturamento não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ message: "Faturamento deletado com sucesso" })
  } catch (error) {
    console.error("Erro ao deletar faturamento:", error)
    return NextResponse.json({ error: "Erro ao deletar faturamento" }, { status: 500 })
  }
}
