import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export async function POST() {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Executa a migração
    await sql`
      ALTER TABLE debitos 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pendente'
    `

    await sql`
      ALTER TABLE debitos 
      ADD COLUMN IF NOT EXISTS data_pagamento DATE
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_debitos_status ON debitos(status)
    `

    await sql`
      UPDATE debitos 
      SET status = 'pendente' 
      WHERE status IS NULL
    `

    return Response.json(
      { success: true, message: "Migração executada com sucesso" },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    console.error("Erro ao executar migração:", error)
    return Response.json({ error: "Erro ao executar migração" }, { status: 500 })
  }
}
