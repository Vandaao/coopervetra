import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Tentar acessar a coluna status
    await sql`SELECT status FROM fretes LIMIT 1`

    return NextResponse.json({ needsMigration: false })
  } catch (error: any) {
    // Se o erro for sobre a coluna não existir, a migração é necessária
    if (error.message?.includes("column") && error.message?.includes("status")) {
      return NextResponse.json({ needsMigration: true })
    }

    // Outro tipo de erro
    console.error("Erro ao verificar migração:", error)
    return NextResponse.json({ error: "Erro ao verificar migração" }, { status: 500 })
  }
}
