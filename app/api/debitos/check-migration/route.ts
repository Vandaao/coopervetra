import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Verifica se as colunas de pagamento existem
    const result = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'debitos' 
      AND column_name IN ('status', 'data_pagamento')
    `

    const needsMigration = result.length < 2

    return Response.json(
      { needsMigration },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    console.error("Erro ao verificar migração:", error)
    return Response.json({ error: "Erro ao verificar migração" }, { status: 500 })
  }
}
