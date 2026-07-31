import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Check which columns exist in the debitos table
    const columnsCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'debitos' 
      AND column_name IN ('status', 'eh_parcelado', 'quantidade_parcelas')
    `

    const hasStatus = columnsCheck.some((col) => col.column_name === "status")
    const hasEhParcelado = columnsCheck.some((col) => col.column_name === "eh_parcelado")
    const hasQuantidadeParcelas = columnsCheck.some((col) => col.column_name === "quantidade_parcelas")

    let debitos

    // Build query based on available columns
    if (hasStatus && hasEhParcelado && hasQuantidadeParcelas) {
      debitos = await sql`
        SELECT 
          d.id,
          d.descricao,
          TO_CHAR(d.data, 'YYYY-MM-DD') as data,
          d.valor,
          d.status,
          TO_CHAR(d.data_baixa, 'YYYY-MM-DD') as data_baixa,
          d.observacao_baixa,
          d.eh_parcelado,
          d.quantidade_parcelas,
          c.nome as cooperado_nome,
          e.nome as empresa_nome
        FROM debitos d
        JOIN cooperados c ON d.cooperado_id = c.id
        JOIN empresas e ON d.empresa_id = e.id
        ORDER BY d.data DESC, d.id DESC
      `
    } else if (hasStatus) {
      // Has status but not parcelamento columns
      debitos = await sql`
        SELECT 
          d.id,
          d.descricao,
          TO_CHAR(d.data, 'YYYY-MM-DD') as data,
          d.valor,
          d.status,
          TO_CHAR(d.data_baixa, 'YYYY-MM-DD') as data_baixa,
          d.observacao_baixa,
          c.nome as cooperado_nome,
          e.nome as empresa_nome
        FROM debitos d
        JOIN cooperados c ON d.cooperado_id = c.id
        JOIN empresas e ON d.empresa_id = e.id
        ORDER BY d.data DESC, d.id DESC
      `

      debitos = debitos.map((debito) => ({
        ...debito,
        eh_parcelado: false,
        quantidade_parcelas: 1,
      }))
    } else {
      // Doesn't have status column (older schema)
      debitos = await sql`
        SELECT 
          d.id,
          d.descricao,
          TO_CHAR(d.data, 'YYYY-MM-DD') as data,
          d.valor,
          c.nome as cooperado_nome,
          e.nome as empresa_nome
        FROM debitos d
        JOIN cooperados c ON d.cooperado_id = c.id
        JOIN empresas e ON d.empresa_id = e.id
        ORDER BY d.data DESC, d.id DESC
      `

      debitos = debitos.map((debito) => ({
        ...debito,
        status: "pendente",
        data_baixa: null,
        observacao_baixa: null,
        eh_parcelado: false,
        quantidade_parcelas: 1,
      }))
    }

    // Converter valores para números e buscar parcelas se aplicável
    const debitosFormatados = await Promise.all(
      debitos.map(async (debito) => {
        const formatted = {
          ...debito,
          valor: Number(debito.valor),
          eh_parcelado: debito.eh_parcelado || false,
          quantidade_parcelas: debito.quantidade_parcelas || 1,
        }

        // Se é parcelado, buscar as parcelas
        if (formatted.eh_parcelado) {
          try {
            const parcelas = await sql`
              SELECT 
                id,
                numero_parcela,
                total_parcelas,
                TO_CHAR(data_vencimento, 'YYYY-MM-DD') as data_vencimento,
                valor_parcela,
                status,
                TO_CHAR(data_pagamento, 'YYYY-MM-DD') as data_pagamento
              FROM debitos_parcelamento
              WHERE debito_id = ${debito.id}
              ORDER BY numero_parcela ASC
            `
            formatted.parcelas = parcelas.map((p) => ({
              ...p,
              valor_parcela: Number(p.valor_parcela),
            }))
          } catch (e) {
            // Se a tabela de parcelas não existir, deixar vazio
            formatted.parcelas = []
          }
        }

        return formatted
      }),
    )

    return NextResponse.json(debitosFormatados)
  } catch (error) {
    console.error("Erro ao buscar débitos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { cooperado_id, empresa_id, descricao, data, valor } = await request.json()

    // Check which columns exist in the debitos table
    const columnsCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'debitos' 
      AND column_name IN ('status', 'eh_parcelado', 'quantidade_parcelas')
    `

    const hasStatus = columnsCheck.some((col) => col.column_name === "status")
    const hasEhParcelado = columnsCheck.some((col) => col.column_name === "eh_parcelado")

    let result

    // Build insert based on available columns
    if (hasStatus && hasEhParcelado) {
      result = await sql`
        INSERT INTO debitos (cooperado_id, empresa_id, descricao, data, valor, status, eh_parcelado, quantidade_parcelas)
        VALUES (${cooperado_id}, ${empresa_id}, ${descricao}, ${data}::date, ${valor}, 'pendente', false, 1)
        RETURNING id
      `
    } else if (hasStatus) {
      result = await sql`
        INSERT INTO debitos (cooperado_id, empresa_id, descricao, data, valor, status)
        VALUES (${cooperado_id}, ${empresa_id}, ${descricao}, ${data}::date, ${valor}, 'pendente')
        RETURNING id
      `
    } else {
      result = await sql`
        INSERT INTO debitos (cooperado_id, empresa_id, descricao, data, valor)
        VALUES (${cooperado_id}, ${empresa_id}, ${descricao}, ${data}::date, ${valor})
        RETURNING id
      `
    }

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Erro ao criar débito:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
