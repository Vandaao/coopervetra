import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empresa_id = searchParams.get("empresa_id")
    const data_inicio = searchParams.get("data_inicio")

    if (!empresa_id || !data_inicio) {
      return NextResponse.json({ error: "Parametros obrigatorios" }, { status: 400 })
    }

    // Verificar se coluna status existe
    let hasStatus = false
    try {
      const checkCol = await sql`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'debitos' AND column_name = 'status'
      `
      hasStatus = checkCol.length > 0
    } catch {
      hasStatus = false
    }

    // Verificar se coluna empresa_id existe
    let hasEmpresaId = false
    try {
      const checkCol = await sql`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'debitos' AND column_name = 'empresa_id'
      `
      hasEmpresaId = checkCol.length > 0
    } catch {
      hasEmpresaId = false
    }

    if (!hasEmpresaId) {
      return NextResponse.json({ debitos_pendentes: [] })
    }

    let debitosPendentes
    if (hasStatus) {
      debitosPendentes = await sql`
        SELECT 
          d.id,
          d.cooperado_id,
          c.nome as cooperado_nome,
          d.descricao,
          TO_CHAR(d.data, 'YYYY-MM-DD') as data,
          d.valor
        FROM debitos d
        JOIN cooperados c ON d.cooperado_id = c.id
        WHERE d.empresa_id = ${empresa_id}
          AND d.data < ${data_inicio}::date
          AND (d.status = 'pendente' OR d.status IS NULL)
        ORDER BY c.nome, d.data
      `
    } else {
      debitosPendentes = await sql`
        SELECT 
          d.id,
          d.cooperado_id,
          c.nome as cooperado_nome,
          d.descricao,
          TO_CHAR(d.data, 'YYYY-MM-DD') as data,
          d.valor
        FROM debitos d
        JOIN cooperados c ON d.cooperado_id = c.id
        WHERE d.empresa_id = ${empresa_id}
          AND d.data < ${data_inicio}::date
        ORDER BY c.nome, d.data
      `
    }

    return NextResponse.json({
      debitos_pendentes: debitosPendentes.map((d: Record<string, unknown>) => ({
        id: d.id,
        cooperado_id: d.cooperado_id,
        cooperado_nome: d.cooperado_nome,
        descricao: d.descricao,
        data: d.data,
        valor: Number(d.valor),
      })),
    })
  } catch (error) {
    console.error("Erro ao buscar debitos pendentes:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
