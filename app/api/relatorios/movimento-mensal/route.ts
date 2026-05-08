import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dataInicio = searchParams.get("dataInicio") || ""
    const dataFim = searchParams.get("dataFim") || ""

    if (!dataInicio || !dataFim) {
      return NextResponse.json({ error: "Parâmetros obrigatórios" }, { status: 400 })
    }

    // Gerar movimento diário
    const movimentoDiario = await sql`
      SELECT
        TO_CHAR(DATE(f.data), 'DD/MM') as dia,
        COALESCE(COUNT(DISTINCT f.id), 0) as fretes,
        COALESCE(SUM(f.valor + COALESCE(f.chapada, 0)), 0)::numeric as valor,
        COALESCE(COUNT(DISTINCT d.id), 0) as debitos
      FROM
        (SELECT generate_series(${dataInicio}::date, ${dataFim}::date, '1 day'::interval)::date as data) dates
      LEFT JOIN fretes f ON DATE(f.data) = dates.data
      LEFT JOIN debitos d ON DATE(d.data) = dates.data
      GROUP BY DATE(f.data), dates.data
      ORDER BY dates.data
    `

    const resultado = movimentoDiario.map((row: Record<string, unknown>) => ({
      dia: row.dia as string,
      fretes: Number(row.fretes) || 0,
      valor: Number(row.valor) || 0,
      debitos: Number(row.debitos) || 0,
    }))

    return NextResponse.json(resultado)
  } catch (error) {
    console.error("Erro ao buscar movimento mensal:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
