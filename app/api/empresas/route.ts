import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const empresas = await sql`
      SELECT id, nome, cnpj 
      FROM empresas 
      ORDER BY nome
    `
    return NextResponse.json(empresas)
  } catch (error) {
    console.error("Erro ao buscar empresas:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nome, cnpj } = await request.json()

    const result = await sql`
      INSERT INTO empresas (nome, cnpj)
      VALUES (${nome}, ${cnpj})
      RETURNING id, nome, cnpj
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Erro ao criar empresa:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
