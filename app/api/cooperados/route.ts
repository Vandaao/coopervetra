import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const cooperados = await sql`
      SELECT id, nome, cpf, placa, conta_bancaria
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
    const { nome, cpf, placa, conta_bancaria } = await request.json()

    const result = await sql`
      INSERT INTO cooperados (nome, cpf, placa, conta_bancaria)
      VALUES (${nome}, ${cpf}, ${placa}, ${conta_bancaria || null})
      RETURNING id, nome, cpf, placa, conta_bancaria
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Erro ao criar cooperado:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
