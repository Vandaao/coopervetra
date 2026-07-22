import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Check if the status column exists in the debitos table
    const checkColumn = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'debitos' 
      AND column_name = 'status'
    `

    let debitos

    // If the status column exists, use it in the query
    if (checkColumn.length > 0) {
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
    } else {
      // If the status column doesn't exist, use a simplified query and add default values
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

      // Add default values for the missing columns
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

    // Check if the status column exists in the debitos table
    const checkColumn = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'debitos' 
      AND column_name = 'status'
    `

    let result

    // If the status column exists, include it in the insert query
    if (checkColumn.length > 0) {
      result = await sql`
        INSERT INTO debitos (cooperado_id, empresa_id, descricao, data, valor, status)
        VALUES (${cooperado_id}, ${empresa_id}, ${descricao}, ${data}::date, ${valor}, 'pendente')
        RETURNING id
      `
    } else {
      // Otherwise, use the original query without the status column
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
