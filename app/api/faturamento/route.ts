import { sql } from "@vercel/postgres"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const dataInicio = searchParams.get("dataInicio")
    const dataFim = searchParams.get("dataFim")

    let query = "SELECT * FROM faturamento WHERE 1=1"
    const params: (string | null)[] = []

    if (status && status !== "todos") {
      query += " AND status = $1"
      params.push(status)
    }

    if (dataInicio) {
      query += ` AND data_emissao >= $${params.length + 1}::date`
      params.push(dataInicio)
    }

    if (dataFim) {
      query += ` AND data_emissao <= $${params.length + 1}::date`
      params.push(dataFim)
    }

    query += " ORDER BY data_vencimento DESC"

    const result = await sql.query(query, params.filter((p) => p !== null))
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Erro ao buscar faturamento:", error)
    return NextResponse.json({ error: "Erro ao buscar faturamento" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cliente, documento_referencia, data_emissao, data_vencimento, valor } = body

    if (!cliente || !data_emissao || !data_vencimento || !valor) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 },
      )
    }

    const result = await sql`
      INSERT INTO faturamento (cliente, documento_referencia, data_emissao, data_vencimento, valor)
      VALUES (${cliente}, ${documento_referencia}, ${data_emissao}, ${data_vencimento}, ${valor})
      RETURNING *
    `

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Erro ao criar faturamento:", error)
    return NextResponse.json({ error: "Erro ao criar faturamento" }, { status: 500 })
  }
}
