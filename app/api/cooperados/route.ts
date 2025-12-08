import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

const sql = neon(process.env.DATABASE_URL!)

async function checkAndMigrate() {
  try {
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'cooperados' AND column_name = 'ativo'
    `

    if (columns.length === 0) {
      await sql`ALTER TABLE cooperados ADD COLUMN ativo BOOLEAN DEFAULT TRUE`
      await sql`UPDATE cooperados SET ativo = TRUE WHERE ativo IS NULL`
      console.log("[v0] Migração de status de cooperados executada com sucesso")
    }
  } catch (error) {
    console.error("[v0] Erro na migração:", error)
  }
}

export async function GET() {
  try {
    // Verificar migração antes de buscar
    await checkAndMigrate()

    const cooperados = await sql`
      SELECT id, nome, cpf, placa, conta_bancaria, COALESCE(ativo, true) as ativo
      FROM cooperados 
      ORDER BY nome
    `
    return NextResponse.json(cooperados)
  } catch (error) {
    console.error("Erro ao buscar cooperados:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar migração antes de inserir
    await checkAndMigrate()

    const { nome, cpf, placa, conta_bancaria, ativo = true } = await request.json()

    const result = await sql`
      INSERT INTO cooperados (nome, cpf, placa, conta_bancaria, ativo)
      VALUES (${nome}, ${cpf}, ${placa}, ${conta_bancaria || null}, ${ativo})
      RETURNING id, nome, cpf, placa, conta_bancaria, ativo
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Erro ao criar cooperado:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
