import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST() {
  try {
    console.log("[v0] Iniciando migração da tabela fretes...")

    // Adicionar colunas
    await sql`
      ALTER TABLE fretes 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pendente',
      ADD COLUMN IF NOT EXISTS data_pagamento DATE
    `

    console.log("[v0] Colunas adicionadas com sucesso")

    // Criar índice
    await sql`
      CREATE INDEX IF NOT EXISTS idx_fretes_status ON fretes(status)
    `

    console.log("[v0] Índice criado com sucesso")

    return NextResponse.json({
      success: true,
      message: "Migração executada com sucesso",
    })
  } catch (error: any) {
    console.error("[v0] Erro ao executar migração:", error)
    return NextResponse.json(
      {
        error: "Erro ao executar migração",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
