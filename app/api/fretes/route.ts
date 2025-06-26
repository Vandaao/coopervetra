import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const fretes = await sql`
      SELECT 
        f.id,
        f.carga,
        f.km,
        f.valor,
        f.chapada,
        f.data,
        c.nome as cooperado_nome,
        e.nome as empresa_nome
      FROM fretes f
      JOIN cooperados c ON f.cooperado_id = c.id
      JOIN empresas e ON f.empresa_id = e.id
      ORDER BY f.data DESC
    `

    // Converter valores para números
    const fretesFormatados = fretes.map((frete) => ({
      ...frete,
      valor: Number(frete.valor),
      chapada: Number(frete.chapada),
      km: Number(frete.km),
    }))

    return NextResponse.json(fretesFormatados)
  } catch (error) {
    console.error("Erro ao buscar fretes:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { cooperado_id, empresa_id, carga, km, valor, chapada, data } = await request.json()

    const result = await sql`
      INSERT INTO fretes (cooperado_id, empresa_id, carga, km, valor, chapada, data)
      VALUES (${cooperado_id}, ${empresa_id}, ${carga}, ${km}, ${valor}, ${chapada}, ${data})
      RETURNING id
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Erro ao criar frete:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
