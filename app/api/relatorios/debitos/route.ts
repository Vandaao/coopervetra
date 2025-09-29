import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const data_inicio = searchParams.get("data_inicio")
    const data_fim = searchParams.get("data_fim")

    if (!data_inicio || !data_fim) {
      return NextResponse.json({ error: "Parâmetros obrigatórios: data_inicio, data_fim" }, { status: 400 })
    }

    // Buscar débitos no período
    const debitos = await sql`
      SELECT 
        TO_CHAR(d.data, 'YYYY-MM-DD') as data,
        d.descricao,
        d.valor,
        c.nome as cooperado_nome,
        e.nome as empresa_nome
      FROM debitos d
      JOIN cooperados c ON d.cooperado_id = c.id
      JOIN empresas e ON d.empresa_id = e.id
      WHERE d.data >= ${data_inicio}::date
        AND d.data <= ${data_fim}::date
      ORDER BY d.data DESC, c.nome, e.nome
    `

    // Calcular estatísticas
    const totalDebitos = debitos.length
    const valorTotal = debitos.reduce((sum, debito) => sum + Number(debito.valor), 0)

    // Contar cooperados únicos
    const cooperadosUnicos = new Set(debitos.map((d) => d.cooperado_nome))
    const totalCooperados = cooperadosUnicos.size

    // Contar empresas únicas
    const empresasUnicas = new Set(debitos.map((d) => d.empresa_nome))
    const totalEmpresas = empresasUnicas.size

    // Formatar débitos
    const debitosFormatados = debitos.map((debito) => ({
      ...debito,
      valor: Number(debito.valor),
    }))

    const relatorio = {
      data_inicio,
      data_fim,
      total_debitos: totalDebitos,
      total_cooperados: totalCooperados,
      total_empresas: totalEmpresas,
      valor_total: valorTotal,
      debitos: debitosFormatados,
    }

    return NextResponse.json(relatorio)
  } catch (error) {
    console.error("Erro ao gerar relatório de débitos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
