import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

const sql = neon(process.env.DATABASE_URL!)

function getCacheHeaders() {
  return {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dataInicio = searchParams.get("dataInicio")
    const dataFim = searchParams.get("dataFim")

    let ranking

    if (dataInicio && dataFim) {
      ranking = await sql`
        SELECT 
          c.id,
          c.nome,
          c.placa,
          COALESCE(SUM(f.km), 0) as total_km,
          COUNT(f.id) as total_fretes
        FROM cooperados c
        LEFT JOIN fretes f ON f.cooperado_id = c.id 
          AND f.data >= ${dataInicio} AND f.data <= ${dataFim}
        GROUP BY c.id, c.nome, c.placa
        HAVING COALESCE(SUM(f.km), 0) > 0
        ORDER BY total_km DESC
      `
    } else {
      ranking = await sql`
        SELECT 
          c.id,
          c.nome,
          c.placa,
          COALESCE(SUM(f.km), 0) as total_km,
          COUNT(f.id) as total_fretes
        FROM cooperados c
        LEFT JOIN fretes f ON f.cooperado_id = c.id
        GROUP BY c.id, c.nome, c.placa
        HAVING COALESCE(SUM(f.km), 0) > 0
        ORDER BY total_km DESC
      `
    }

    return NextResponse.json(ranking, { headers: getCacheHeaders() })
  } catch (error) {
    console.error("Erro ao buscar ranking:", error)
    return NextResponse.json({ error: "Erro ao buscar ranking" }, { status: 500, headers: getCacheHeaders() })
  }
}
