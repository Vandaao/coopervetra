import { sql } from "@vercel/postgres"
import { NextRequest, NextResponse } from "next/server"

// Inicializar tabela se não existir
async function initializeTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS taxas_descontos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL UNIQUE,
        percentual DECIMAL(5,2) NOT NULL,
        descricao VARCHAR(500),
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Inserir taxas padrão se não existirem
    try {
      await sql`
        INSERT INTO taxas_descontos (nome, percentual, descricao, ativo) 
        VALUES ('INSS', 4.50, 'Desconto INSS - 4,5%', true)
        ON CONFLICT (nome) DO NOTHING
      `
      await sql`
        INSERT INTO taxas_descontos (nome, percentual, descricao, ativo) 
        VALUES ('Administrativo', 6.00, 'Taxa Administrativa - 6%', true)
        ON CONFLICT (nome) DO NOTHING
      `
    } catch (e) {
      // Taxas podem já existir
    }
  } catch (error) {
    console.error("Erro ao inicializar tabela de taxas:", error)
  }
}

export async function GET(request: NextRequest) {
  try {
    await initializeTable()

    const result = await sql`
      SELECT * FROM taxas_descontos 
      WHERE ativo = true
      ORDER BY nome
    `

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Erro ao buscar taxas:", error)
    return NextResponse.json({ error: "Erro ao buscar taxas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeTable()
    const body = await request.json()
    const { nome, percentual, descricao } = body

    if (!nome || percentual === undefined) {
      return NextResponse.json({ error: "Nome e percentual são obrigatórios" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO taxas_descontos (nome, percentual, descricao, ativo)
      VALUES (${nome}, ${percentual}, ${descricao || null}, true)
      ON CONFLICT (nome) DO UPDATE SET 
        percentual = EXCLUDED.percentual,
        descricao = EXCLUDED.descricao,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Erro ao criar/atualizar taxa:", error)
    return NextResponse.json({ error: "Erro ao criar/atualizar taxa" }, { status: 500 })
  }
}
