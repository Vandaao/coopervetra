import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const cooperados = await sql`
      SELECT id, nome, cpf, placa 
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
    const { nome, cpf, placa } = await request.json()

    const result = await sql`
      INSERT INTO cooperados (nome, cpf, placa)
      VALUES (${nome}, ${cpf}, ${placa})
      RETURNING id, nome, cpf, placa
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Erro ao criar cooperado:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
