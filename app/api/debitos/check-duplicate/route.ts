import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { cooperado_id, empresa_id, data, valor } = await request.json()

    // Buscar débitos com a mesma data e valor para o mesmo cooperado na mesma empresa
    const duplicados = await sql`
      SELECT 
        d.id,
        d.descricao,
        TO_CHAR(d.data, 'YYYY-MM-DD') as data,
        d.valor,
        d.status,
        c.nome as cooperado_nome,
        e.nome as empresa_nome
      FROM debitos d
      JOIN cooperados c ON d.cooperado_id = c.id
      JOIN empresas e ON d.empresa_id = e.id
      WHERE d.cooperado_id = ${cooperado_id}
        AND d.empresa_id = ${empresa_id}
        AND d.data = ${data}::date
        AND d.valor = ${valor}
        AND (d.status IS NULL OR d.status != 'pago')
      ORDER BY d.id DESC
    `

    return NextResponse.json({
      encontrados: duplicados.length > 0,
      duplicados: duplicados.map((d) => ({
        ...d,
        valor: Number(d.valor),
      })),
    })
  } catch (error) {
    console.error("Erro ao verificar débitos duplicados:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
