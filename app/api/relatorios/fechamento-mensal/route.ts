import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dataInicio = searchParams.get("data_inicio")
    const dataFim = searchParams.get("data_fim")
    const empresaId = searchParams.get("empresa_id")

    if (!dataInicio || !dataFim) {
      return NextResponse.json({ error: "Datas são obrigatórias" }, { status: 400 })
    }

    // Buscar fretes pagos no período (pela data de pagamento)
    let query
    if (empresaId && empresaId !== "todas") {
      query = sql`
        SELECT 
          f.id,
          f.carga,
          f.km,
          f.valor,
          f.chapada,
          TO_CHAR(f.data, 'YYYY-MM-DD') as data_frete,
          TO_CHAR(f.data_pagamento, 'YYYY-MM-DD') as data_pagamento,
          c.id as cooperado_id,
          c.nome as cooperado_nome,
          e.id as empresa_id,
          e.nome as empresa_nome
        FROM fretes f
        JOIN cooperados c ON f.cooperado_id = c.id
        JOIN empresas e ON f.empresa_id = e.id
        WHERE f.status = 'pago'
          AND f.data_pagamento >= ${dataInicio}
          AND f.data_pagamento <= ${dataFim}
          AND f.empresa_id = ${Number(empresaId)}
        ORDER BY c.nome, f.data_pagamento
      `
    } else {
      query = sql`
        SELECT 
          f.id,
          f.carga,
          f.km,
          f.valor,
          f.chapada,
          TO_CHAR(f.data, 'YYYY-MM-DD') as data_frete,
          TO_CHAR(f.data_pagamento, 'YYYY-MM-DD') as data_pagamento,
          c.id as cooperado_id,
          c.nome as cooperado_nome,
          e.id as empresa_id,
          e.nome as empresa_nome
        FROM fretes f
        JOIN cooperados c ON f.cooperado_id = c.id
        JOIN empresas e ON f.empresa_id = e.id
        WHERE f.status = 'pago'
          AND f.data_pagamento >= ${dataInicio}
          AND f.data_pagamento <= ${dataFim}
        ORDER BY c.nome, f.data_pagamento
      `
    }

    const fretes = await query

    // Agrupar por cooperado e empresa
    const agrupado: Record<
      string,
      {
        cooperado_id: number
        cooperado_nome: string
        empresas: Record<
          string,
          {
            empresa_id: number
            empresa_nome: string
            valor_bruto: number
            total_fretes: number
          }
        >
        total_geral: number
      }
    > = {}

    for (const frete of fretes) {
      const cooperadoKey = frete.cooperado_id.toString()
      const empresaKey = frete.empresa_id.toString()
      const valorBruto = Number(frete.valor) + Number(frete.chapada)

      if (!agrupado[cooperadoKey]) {
        agrupado[cooperadoKey] = {
          cooperado_id: frete.cooperado_id,
          cooperado_nome: frete.cooperado_nome,
          empresas: {},
          total_geral: 0,
        }
      }

      if (!agrupado[cooperadoKey].empresas[empresaKey]) {
        agrupado[cooperadoKey].empresas[empresaKey] = {
          empresa_id: frete.empresa_id,
          empresa_nome: frete.empresa_nome,
          valor_bruto: 0,
          total_fretes: 0,
        }
      }

      agrupado[cooperadoKey].empresas[empresaKey].valor_bruto += valorBruto
      agrupado[cooperadoKey].empresas[empresaKey].total_fretes += 1
      agrupado[cooperadoKey].total_geral += valorBruto
    }

    // Converter para array e formatar
    const resultado = Object.values(agrupado).map((cooperado) => ({
      cooperado_id: cooperado.cooperado_id,
      cooperado_nome: cooperado.cooperado_nome,
      empresas: Object.values(cooperado.empresas),
      total_geral: cooperado.total_geral,
    }))

    // Calcular totais gerais
    const totalGeral = resultado.reduce((sum, c) => sum + c.total_geral, 0)
    const totalFretes = fretes.length
    const totalCooperados = resultado.length

    return NextResponse.json(
      {
        data_inicio: dataInicio,
        data_fim: dataFim,
        cooperados: resultado,
        totais: {
          total_cooperados: totalCooperados,
          total_fretes: totalFretes,
          valor_total: totalGeral,
        },
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    console.error("Erro ao gerar relatório de fechamento mensal:", error)
    return NextResponse.json({ error: "Erro ao gerar relatório" }, { status: 500 })
  }
}
