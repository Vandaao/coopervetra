import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const debitos = await sql`
      SELECT 
        d.id,
        d.descricao,
        TO_CHAR(d.data, 'YYYY-MM-DD') as data,
        d.valor,
        c.nome as cooperado_nome,
        e.nome as empresa_nome
      FROM debitos d
      JOIN cooperados c ON d.cooperado_id = c.id
      JOIN empresas e ON d.empresa_id = e.id
      ORDER BY d.data DESC
    `

    // Converter valores para números
    const debitosFormatados = debitos.map((debito) => ({
      ...debito,
      valor: Number(debito.valor),
    }))

    return NextResponse.json(debitosFormatados)
  } catch (error) {
    console.error("Erro ao buscar débitos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { cooperado_id, empresa_id, descricao, data, valor } = await request.json()

    const result = await sql`
      INSERT INTO debitos (cooperado_id, empresa_id, descricao, data, valor)
      VALUES (${cooperado_id}, ${empresa_id}, ${descricao}, ${data}::date, ${valor})
      RETURNING id
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Erro ao criar débito:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
