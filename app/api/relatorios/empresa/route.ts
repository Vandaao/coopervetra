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
    const data_fim = searchParams.get("data_fim")

    if (!empresa_id || !data_inicio || !data_fim) {
      return NextResponse.json({ error: "Parâmetros obrigatórios: empresa_id, data_inicio, data_fim" }, { status: 400 })
    }

    // Buscar dados da empresa
    const empresa = await sql`
      SELECT nome FROM empresas WHERE id = ${empresa_id}
    `

    if (empresa.length === 0) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 })
    }

    // Buscar fretes no período agrupados por cooperado
    const fretesCooperados = await sql`
      SELECT 
        c.id as cooperado_id,
        c.nome as cooperado_nome,
        COUNT(f.id) as total_fretes,
        SUM(f.valor) as total_valor_fretes,
        SUM(f.chapada) as total_chapada,
        SUM(f.km) as total_km,
        SUM(f.valor + f.chapada) as valor_bruto
      FROM fretes f
      JOIN cooperados c ON f.cooperado_id = c.id
      WHERE f.empresa_id = ${empresa_id}
        AND f.data >= ${data_inicio}::date
        AND f.data <= ${data_fim}::date
      GROUP BY c.id, c.nome
      ORDER BY c.nome
    `

    // Buscar débitos no período para cada cooperado DA MESMA EMPRESA
    const cooperadosIds = fretesCooperados.map((f) => f.cooperado_id)
    let debitos = []

    if (cooperadosIds.length > 0) {
      debitos = await sql`
        SELECT 
          cooperado_id,
          SUM(valor) as total_debitos
        FROM debitos
        WHERE cooperado_id = ANY(${cooperadosIds})
          AND empresa_id = ${empresa_id}
          AND data >= ${data_inicio}::date
          AND data <= ${data_fim}::date
        GROUP BY cooperado_id
      `
    }

    // Buscar detalhes dos fretes para cada cooperado
    const fretesDetalhados = await sql`
      SELECT 
        f.cooperado_id,
        TO_CHAR(f.data, 'YYYY-MM-DD') as data,
        f.carga,
        f.km,
        f.valor,
        f.chapada
      FROM fretes f
      WHERE f.empresa_id = ${empresa_id}
        AND f.data >= ${data_inicio}::date
        AND f.data <= ${data_fim}::date
      ORDER BY f.cooperado_id, f.data
    `

    // Buscar detalhes dos débitos para cada cooperado DA MESMA EMPRESA
    let debitosDetalhados = []
    if (cooperadosIds.length > 0) {
      debitosDetalhados = await sql`
        SELECT 
          cooperado_id,
          TO_CHAR(data, 'YYYY-MM-DD') as data,
          descricao,
          valor
        FROM debitos
        WHERE cooperado_id = ANY(${cooperadosIds})
          AND empresa_id = ${empresa_id}
          AND data >= ${data_inicio}::date
          AND data <= ${data_fim}::date
        ORDER BY cooperado_id, data
      `
    }

    // Processar dados por cooperado
    const cooperadosRelatorio = fretesCooperados.map((cooperado) => {
      const valorBruto = Number(cooperado.valor_bruto)
      const descontoInss = valorBruto * 0.045 // 4.5%
      const descontoAdministrativo = valorBruto * 0.06 // 6%

      // Buscar débitos do cooperado
      const debitoCooperado = debitos.find((d) => d.cooperado_id === cooperado.cooperado_id)
      const totalDebitos = debitoCooperado ? Number(debitoCooperado.total_debitos) : 0

      const totalDescontos = descontoInss + descontoAdministrativo + totalDebitos
      const valorLiquido = valorBruto - totalDescontos

      // Buscar fretes detalhados do cooperado
      const fretesDoCooperado = fretesDetalhados.filter((f) => f.cooperado_id === cooperado.cooperado_id)

      // Buscar débitos detalhados do cooperado
      const debitosDoCooperado = debitosDetalhados.filter((d) => d.cooperado_id === cooperado.cooperado_id)

      return {
        cooperado_id: cooperado.cooperado_id,
        cooperado_nome: cooperado.cooperado_nome,
        total_fretes: Number(cooperado.total_fretes),
        total_valor_fretes: Number(cooperado.total_valor_fretes),
        total_chapada: Number(cooperado.total_chapada),
        total_km: Number(cooperado.total_km),
        valor_bruto: valorBruto,
        desconto_inss: descontoInss,
        desconto_administrativo: descontoAdministrativo,
        total_debitos: totalDebitos,
        total_descontos: totalDescontos,
        valor_liquido: valorLiquido,
        fretes: fretesDoCooperado.map((f) => ({
          data: f.data,
          carga: f.carga,
          km: Number(f.km),
          valor: Number(f.valor),
          chapada: Number(f.chapada),
        })),
        debitos: debitosDoCooperado.map((d) => ({
          data: d.data,
          descricao: d.descricao,
          valor: Number(d.valor),
        })),
      }
    })

    // Calcular totais gerais
    const totaisGerais = {
      total_cooperados: cooperadosRelatorio.length,
      total_fretes: cooperadosRelatorio.reduce((sum, c) => sum + c.total_fretes, 0),
      total_km: cooperadosRelatorio.reduce((sum, c) => sum + c.total_km, 0),
      total_valor_bruto: cooperadosRelatorio.reduce((sum, c) => sum + c.valor_bruto, 0),
      total_desconto_inss: cooperadosRelatorio.reduce((sum, c) => sum + c.desconto_inss, 0),
      total_desconto_administrativo: cooperadosRelatorio.reduce((sum, c) => sum + c.desconto_administrativo, 0),
      total_debitos: cooperadosRelatorio.reduce((sum, c) => sum + c.total_debitos, 0),
      total_descontos: cooperadosRelatorio.reduce((sum, c) => sum + c.total_descontos, 0),
      total_valor_liquido: cooperadosRelatorio.reduce((sum, c) => sum + c.valor_liquido, 0),
    }

    const relatorio = {
      empresa_nome: empresa[0].nome,
      data_inicio,
      data_fim,
      cooperados: cooperadosRelatorio,
      totais: totaisGerais,
    }

    return NextResponse.json(relatorio)
  } catch (error) {
    console.error("Erro ao gerar relatório por empresa:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
