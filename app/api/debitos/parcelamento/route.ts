import { neon } from "@neondatabase/serverless"
import { NextResponse, NextRequest } from "next/server"
import { addMonths, format } from "date-fns"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      cooperado_id,
      empresa_id,
      descricao,
      data,
      valor_total,
      quantidade_parcelas,
      data_vencimento_primeira,
      observacao,
    } = body

    if (!cooperado_id || !empresa_id || !descricao || !data || !valor_total) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 },
      )
    }

    const numParcelas = Math.max(1, parseInt(quantidade_parcelas) || 1)
    
    if (numParcelas < 1) {
      return NextResponse.json(
        { error: "Quantidade de parcelas deve ser no mínimo 1" },
        { status: 400 },
      )
    }

    // Valor de cada parcela (dividido igualmente)
    const valorParcela = Math.round((valor_total / numParcelas) * 100) / 100

    // Calcular datas de vencimento para cada parcela
    let dataPrimeiraVencimento = new Date(data_vencimento_primeira || data)
    if (!data_vencimento_primeira) {
      dataPrimeiraVencimento = addMonths(new Date(data), 1)
    }

    // Criar o débito
    const debitoResult = await sql`
      INSERT INTO debitos (
        cooperado_id,
        empresa_id,
        descricao,
        data,
        valor,
        observacao,
        eh_parcelado,
        quantidade_parcelas,
        status
      )
      VALUES (
        ${cooperado_id},
        ${empresa_id},
        ${descricao},
        ${data},
        ${valor_total},
        ${observacao || null},
        true,
        ${numParcelas},
        'pendente'
      )
      RETURNING id
    `

    const debitoId = debitoResult[0].id

    // Criar as parcelas
    const parcelas = []
    for (let i = 1; i <= numParcelas; i++) {
      const dataVencimento = addMonths(dataPrimeiraVencimento, i - 1)
      
      const parcelaResult = await sql`
        INSERT INTO debitos_parcelamento (
          debito_id,
          numero_parcela,
          total_parcelas,
          data_vencimento,
          valor_parcela,
          status
        )
        VALUES (
          ${debitoId},
          ${i},
          ${numParcelas},
          ${format(dataVencimento, "yyyy-MM-dd")},
          ${valorParcela},
          'pendente'
        )
        RETURNING id, numero_parcela, total_parcelas, data_vencimento, valor_parcela, status
      `
      
      parcelas.push(parcelaResult[0])
    }

    return NextResponse.json({
      success: true,
      debito_id: debitoId,
      valor_total,
      quantidade_parcelas: numParcelas,
      valor_parcela: valorParcela,
      parcelas,
      message: `Débito parcelado criado com sucesso em ${numParcelas} parcela${numParcelas > 1 ? "s" : ""}`,
    })
  } catch (error) {
    console.error("Erro ao criar débito parcelado:", error)
    return NextResponse.json(
      {
        error: "Erro ao criar débito parcelado",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

// GET - Listar parcelas de um débito
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const debitoId = searchParams.get("debito_id")

    if (!debitoId) {
      return NextResponse.json(
        { error: "debito_id é obrigatório" },
        { status: 400 },
      )
    }

    const parcelas = await sql`
      SELECT 
        id,
        debito_id,
        numero_parcela,
        total_parcelas,
        data_vencimento,
        valor_parcela,
        status,
        data_pagamento,
        created_at,
        updated_at
      FROM debitos_parcelamento
      WHERE debito_id = ${parseInt(debitoId)}
      ORDER BY numero_parcela ASC
    `

    return NextResponse.json({
      success: true,
      debito_id: parseInt(debitoId),
      parcelas,
      total_parcelas: parcelas.length,
    })
  } catch (error) {
    console.error("Erro ao buscar parcelas:", error)
    return NextResponse.json(
      {
        error: "Erro ao buscar parcelas",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
