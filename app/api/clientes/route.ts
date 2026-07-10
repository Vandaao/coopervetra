import { sql } from "@vercel/postgres"
import { NextRequest, NextResponse } from "next/server"

// Inicializar tabela de clientes se não existir
async function initializeTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        cnpj VARCHAR(20) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`CREATE INDEX IF NOT EXISTS idx_clientes_cnpj ON clientes(cnpj)`
    await sql`CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome)`

    // Verificar se coluna cliente_id existe na tabela faturamento
    try {
      const columnExists = await sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'faturamento' AND column_name = 'cliente_id'
        )
      `
      
      if (!columnExists.rows[0].exists) {
        await sql`
          ALTER TABLE faturamento 
          ADD COLUMN cliente_id INTEGER REFERENCES clientes(id) ON DELETE RESTRICT
        `
      }
    } catch (e) {
      // Tabela faturamento pode não existir ainda
    }

    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_faturamento_cliente_id ON faturamento(cliente_id)`
    } catch (e) {
      // Índice pode já existir, ignora
    }
  } catch (error) {
    console.error("Erro ao inicializar tabela de clientes:", error)
  }
}

export async function GET() {
  try {
    await initializeTable()

    const result = await sql`
      SELECT * FROM clientes 
      ORDER BY nome ASC
    `

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Erro ao buscar clientes:", error)
    return NextResponse.json({ error: "Erro ao buscar clientes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeTable()
    const body = await request.json()

    const { nome, cnpj } = body

    if (!nome || !cnpj) {
      return NextResponse.json(
        { error: "Nome e CNPJ são obrigatórios" },
        { status: 400 },
      )
    }

    const result = await sql`
      INSERT INTO clientes (nome, cnpj)
      VALUES (${nome}, ${cnpj})
      RETURNING *
    `

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Erro ao criar cliente:", error)
    if ((error as any).message?.includes("duplicate")) {
      return NextResponse.json(
        { error: "Este CNPJ já está cadastrado" },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: "Erro ao criar cliente" }, { status: 500 })
  }
}
