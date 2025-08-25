import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

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
      GROUP BY c.id, c.nome, c.conta_bancaria
      ORDER BY c.nome
    `

    // Buscar débitos no período para cada cooperado
    const cooperadosIds = cooperadosPagamento.map((c) => c.cooperado_id)
    let debitos = []

    if (cooperadosIds.length > 0) {
      debitos = await sql`
        SELECT 
          cooperado_id,
          SUM(valor) as total_debitos
        FROM debitos
        WHERE cooperado_id = ANY(${cooperadosIds})
          AND data >= ${data_inicio}::date
          AND data <= ${data_fim}::date
        GROUP BY cooperado_id
      `
    }

    // Processar dados da folha de pagamento
    const folhaPagamento = cooperadosPagamento.map((cooperado) => {
      const valorBruto = Number(cooperado.valor_bruto)
      const descontoInss = valorBruto * 0.045 // 4.5%
      const descontoAdministrativo = valorBruto * 0.06 // 6%

      // Buscar débitos do cooperado
      const debitoCooperado = debitos.find((d) => d.cooperado_id === cooperado.cooperado_id)
      const totalDebitos = debitoCooperado ? Number(debitoCooperado.total_debitos) : 0

      const totalDescontos = descontoInss + descontoAdministrativo + totalDebitos
      const valorLiquido = valorBruto - totalDescontos

      return {
        cooperado_id: cooperado.cooperado_id,
        cooperado_nome: cooperado.cooperado_nome,
        conta_bancaria: cooperado.conta_bancaria || "Dados bancários não informados",
        valor_bruto: valorBruto,
        desconto_inss: descontoInss,
        desconto_administrativo: descontoAdministrativo,
        total_debitos: totalDebitos,
        total_descontos: totalDescontos,
        valor_liquido: valorLiquido,
      }
    })

    // Calcular total geral
    const totalGeral = folhaPagamento.reduce((sum, item) => sum + item.valor_liquido, 0)

    const relatorio = {
      empresa_nome: empresa[0].nome,
      data_inicio,
      data_fim,
      cooperados: folhaPagamento,
      total_geral: totalGeral,
    }

    return NextResponse.json(relatorio)
  } catch (error) {
    console.error("Erro ao gerar folha de pagamento:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
