import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function POST() {
  try {
    // Verificar se a tabela já existe
    const checkTable = await sql`
      SELECT to_regclass('public.debitos_parcelamento')
    `

    if (checkTable[0].to_regclass) {
      return NextResponse.json({
        message: "Tabela debitos_parcelamento já existe.",
        alreadyExists: true,
      })
    }

    // Criar tabela de parcelamento
    await sql`
      CREATE TABLE debitos_parcelamento (
        id SERIAL PRIMARY KEY,
        debito_id INTEGER NOT NULL REFERENCES debitos(id) ON DELETE CASCADE,
        numero_parcela INTEGER NOT NULL,
        total_parcelas INTEGER NOT NULL,
        data_vencimento DATE NOT NULL,
        valor_parcela DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pendente',
        data_pagamento DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Criar índices para performance
    await sql`
      CREATE INDEX idx_debitos_parcelamento_debito_id ON debitos_parcelamento(debito_id)
    `

    await sql`
      CREATE INDEX idx_debitos_parcelamento_status ON debitos_parcelamento(status)
    `

    await sql`
      CREATE INDEX idx_debitos_parcelamento_data_vencimento ON debitos_parcelamento(data_vencimento)
    `

    // Adicionar coluna para rastrear se é parcelado na tabela debitos
    await sql`
      ALTER TABLE debitos 
      ADD COLUMN IF NOT EXISTS eh_parcelado BOOLEAN DEFAULT false
    `

    await sql`
      ALTER TABLE debitos 
      ADD COLUMN IF NOT EXISTS quantidade_parcelas INTEGER DEFAULT 1
    `

    return NextResponse.json({
      success: true,
      message: "Tabela debitos_parcelamento criada com sucesso, índices e colunas adicionadas.",
    })
  } catch (error) {
    console.error("Erro ao executar migração de parcelamento:", error)
    return NextResponse.json(
      {
        error: "Erro ao executar migração",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
