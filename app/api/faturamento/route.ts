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

    // Compatibilidade com a tabela legada, que usava cliente (texto) como NOT NULL.
    // O formulário atual usa cliente_id; a coluna antiga precisa ser opcional para não bloquear novos lançamentos.
    try {
      const legacyColumnExists = await sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'faturamento' AND column_name = 'cliente'
        ) AS exists
      `

      if (legacyColumnExists.rows[0]?.exists) {
        await sql`ALTER TABLE faturamento ALTER COLUMN cliente DROP NOT NULL`
      }
    } catch (e) {
      console.warn("Não foi possível ajustar a coluna legada cliente:", e)
    }

    // Garantir a coluna usada pelo formulário em instalações antigas.
    await sql`
      ALTER TABLE faturamento
      ADD COLUMN IF NOT EXISTS cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL
    `

    await sql`CREATE INDEX IF NOT EXISTS idx_faturamento_data_emissao ON faturamento(data_emissao)`
    await sql`CREATE INDEX IF NOT EXISTS idx_faturamento_data_vencimento ON faturamento(data_vencimento)`
    await sql`CREATE INDEX IF NOT EXISTS idx_faturamento_status ON faturamento(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_faturamento_cliente_id ON faturamento(cliente_id)`
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

    return NextResponse.json(result)
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
      RETURNING id, cliente_id, documento_referencia, data_emissao, data_vencimento, valor, status, observacao, created_at
    `

    // Buscar o cliente para retornar junto
    const faturaComCliente = result.rows[0]
    if (faturaComCliente && faturaComCliente.cliente_id) {
      const cliente = await sql`
        SELECT nome FROM clientes WHERE id = ${faturaComCliente.cliente_id}
      `
      if (cliente.rows.length > 0) {
        faturaComCliente.cliente = cliente.rows[0].nome
      }
    }

    return NextResponse.json(faturaComCliente, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar faturamento:", error)
    return NextResponse.json({ error: "Erro ao criar faturamento" }, { status: 500 })
  }
}
