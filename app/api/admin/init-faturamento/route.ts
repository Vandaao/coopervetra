import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Criar tabela de faturamento
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

    // Criar índices
    await sql`
      CREATE INDEX IF NOT EXISTS idx_faturamento_data_emissao ON faturamento(data_emissao)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_faturamento_data_vencimento ON faturamento(data_vencimento)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_faturamento_status ON faturamento(status)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_faturamento_cliente ON faturamento(cliente)
    `

    return NextResponse.json({ success: true, message: "Tabela de faturamento inicializada com sucesso" })
  } catch (error) {
    console.error("Erro ao inicializar faturamento:", error)
    return NextResponse.json({ error: "Erro ao inicializar faturamento" }, { status: 500 })
  }
}
