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

    // Buscar cooperados que fizeram fretes no período com cálculos
    const cooperadosPagamento = await sql`
      SELECT 
        c.id as cooperado_id,
        c.nome as cooperado_nome,
        c.conta_bancaria,
        SUM(f.valor + f.chapada) as valor_bruto
      FROM fretes f
      JOIN cooperados c ON f.cooperado_id = c.id
      WHERE f.empresa_id = ${empresa_id}
        AND f.data >= ${data_inicio}::date
        AND f.data <= ${data_fim}::date
        AND (f.status IS NULL OR f.status = 'pendente')
      GROUP BY c.id, c.nome, c.conta_bancaria
      ORDER BY c.nome
    `

    // Buscar débitos no período para cada cooperado DA MESMA EMPRESA
    const cooperadosIds = cooperadosPagamento.map((c) => c.cooperado_id)
    let debitos: Array<{ cooperado_id: number; total_debitos: number }> = []

    if (cooperadosIds.length > 0) {
      const debitosResult = await sql`
        SELECT 
          cooperado_id,
          SUM(valor) as total_debitos
        FROM debitos
        WHERE cooperado_id = ANY(${cooperadosIds})
          AND empresa_id = ${empresa_id}
          AND data >= ${data_inicio}::date
          AND data <= ${data_fim}::date
          AND (status IS NULL OR status != 'pago')
        GROUP BY cooperado_id
      `
      debitos = debitosResult.map((debito: any) => ({
        cooperado_id: Number(debito.cooperado_id),
        total_debitos: Number(debito.total_debitos || 0),
      }))
    }

    // Buscar TODAS as taxas ativas
    let taxasList: Array<{ nome: string; percentual: number }> = [
      { nome: "INSS", percentual: 4.5 },
      { nome: "Administrativo", percentual: 6 },
    ]

    try {
      const taxasResult = await sql`
        SELECT nome, percentual FROM taxas_descontos WHERE ativo = true ORDER BY id ASC
      `
      if (taxasResult.length > 0) {
        taxasList = taxasResult.map((t: any) => ({
          nome: t.nome,
          percentual: Number(t.percentual),
        }))
      }
    } catch (e) {
      console.error("Erro ao buscar taxas, usando valores padrão:", e)
    }

    // Processar dados da folha de pagamento
    const folhaPagamento = cooperadosPagamento.map((cooperado) => {
      const valorBruto = Number(cooperado.valor_bruto)

      // Calcular cada taxa sobre o valor bruto
      const descontosTaxas = taxasList.map((taxa) => ({
        nome: taxa.nome,
        percentual: taxa.percentual,
        valor: valorBruto * (taxa.percentual / 100),
      }))
      const totalTaxas = descontosTaxas.reduce((sum, t) => sum + t.valor, 0)

      // Buscar débitos do cooperado
      const debitoCooperado = debitos.find((d) => d.cooperado_id === cooperado.cooperado_id)
      const totalDebitos = debitoCooperado ? Number(debitoCooperado.total_debitos) : 0

      const totalDescontos = totalTaxas + totalDebitos
      const valorLiquido = valorBruto - totalDescontos

      // Compat com campos legados
      const descontoInss = descontosTaxas.find((t) => t.nome.toLowerCase() === "inss")?.valor ?? 0
      const descontoAdministrativo = descontosTaxas.find((t) => t.nome.toLowerCase() === "administrativo")?.valor ?? 0

      return {
        cooperado_id: cooperado.cooperado_id,
        cooperado_nome: cooperado.cooperado_nome,
        conta_bancaria: cooperado.conta_bancaria || "Dados bancários não informados",
        valor_bruto: valorBruto,
        desconto_inss: descontoInss,
        desconto_administrativo: descontoAdministrativo,
        descontos_taxas: descontosTaxas,
        total_debitos: totalDebitos,
        total_descontos: totalDescontos,
        valor_liquido: valorLiquido,
      }
    })

    // Calcular total geral
    const totalGeral = folhaPagamento.reduce((sum, item) => sum + item.valor_liquido, 0)

    // Montar taxas com percentuais (sem valores individuais por cooperado)
    const taxasComPercentuais = taxasList.map((taxa) => ({
      nome: taxa.nome,
      percentual: taxa.percentual,
    }))

    const relatorio = {
      empresa_nome: empresa[0].nome,
      data_inicio,
      data_fim,
      cooperados: folhaPagamento,
      total_geral: totalGeral,
      taxas: taxasComPercentuais,
    }

    return NextResponse.json(relatorio)
  } catch (error) {
    console.error("Erro ao gerar folha de pagamento:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
