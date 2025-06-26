import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cooperado_id = searchParams.get("cooperado_id")
    const data_inicio = searchParams.get("data_inicio")
    const data_fim = searchParams.get("data_fim")

    if (!cooperado_id || !data_inicio || !data_fim) {
      return NextResponse.json(
        { error: "Parâmetros obrigatórios: cooperado_id, data_inicio, data_fim" },
        { status: 400 },
      )
    }

    // Buscar dados do cooperado
    const cooperado = await sql`
      SELECT nome FROM cooperados WHERE id = ${cooperado_id}
    `

    if (cooperado.length === 0) {
      return NextResponse.json({ error: "Cooperado não encontrado" }, { status: 404 })
    }

    // Buscar fretes no período - usando TO_CHAR para formatar a data
    const fretes = await sql`
      SELECT 
        TO_CHAR(f.data, 'YYYY-MM-DD') as data,
        f.carga,
        f.km,
        f.valor,
        f.chapada,
        e.nome as empresa_nome
      FROM fretes f
      JOIN empresas e ON f.empresa_id = e.id
      WHERE f.cooperado_id = ${cooperado_id}
        AND f.data >= ${data_inicio}::date
        AND f.data <= ${data_fim}::date
      ORDER BY f.data
    `

    // Buscar débitos no período - usando TO_CHAR para formatar a data
    const debitos = await sql`
      SELECT 
        TO_CHAR(data, 'YYYY-MM-DD') as data,
        descricao,
        valor
      FROM debitos
      WHERE cooperado_id = ${cooperado_id}
        AND data >= ${data_inicio}::date
        AND data <= ${data_fim}::date
      ORDER BY data
    `

    // Calcular totais
    const total_fretes = fretes.length
    const total_valor = fretes.reduce((sum, frete) => sum + Number(frete.valor), 0)
    const total_chapada = fretes.reduce((sum, frete) => sum + Number(frete.chapada), 0)
    const total_km = fretes.reduce((sum, frete) => sum + Number(frete.km), 0)
    const valor_bruto = total_valor + total_chapada

    // Calcular descontos
    const desconto_inss = valor_bruto * 0.045 // 4.5%
    const desconto_administrativo = valor_bruto * 0.06 // 6%
    const total_debitos = debitos.reduce((sum, debito) => sum + Number(debito.valor), 0)
    const total_descontos = desconto_inss + desconto_administrativo + total_debitos
    const valor_liquido = valor_bruto - total_descontos

    // Formatar fretes e débitos
    const fretesFormatados = fretes.map((frete) => ({
      ...frete,
      valor: Number(frete.valor),
      chapada: Number(frete.chapada),
      km: Number(frete.km),
    }))

    const debitosFormatados = debitos.map((debito) => ({
      ...debito,
      valor: Number(debito.valor),
    }))

    const relatorio = {
      cooperado_nome: cooperado[0].nome,
      total_fretes,
      total_valor,
      total_chapada,
      total_km,
      valor_bruto,
      desconto_inss,
      desconto_administrativo,
      total_debitos,
      total_descontos,
      valor_liquido,
      fretes: fretesFormatados,
      debitos: debitosFormatados,
    }

    return NextResponse.json(relatorio)
  } catch (error) {
    console.error("Erro ao gerar relatório:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
