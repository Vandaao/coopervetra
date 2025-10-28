import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body = await request.json()

    console.log("PUT request received for debito:", id)
    console.log("Request body:", body)

    // Check if the status column exists in the debitos table
    const checkColumn = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'debitos' 
      AND column_name = 'status'
    `

    const hasStatusColumn = checkColumn.length > 0
    console.log("Has status column:", hasStatusColumn)

    // If the status column exists and we're marking as paid/pending
    if (hasStatusColumn) {
      // If it's marking as paid
      if (body.action === "marcar_pago") {
        const { data_baixa, observacao_baixa } = body
        console.log("Marking as paid:", { data_baixa, observacao_baixa })

        const result = await sql`
          UPDATE debitos 
          SET status = 'pago',
              data_baixa = ${data_baixa || new Date().toISOString().split("T")[0]}::date,
              observacao_baixa = ${observacao_baixa || null}
          WHERE id = ${id}
          RETURNING id, status, TO_CHAR(data_baixa, 'YYYY-MM-DD') as data_baixa, observacao_baixa
        `

        console.log("Update result:", result)

        if (result.length === 0) {
          return NextResponse.json({ error: "Débito não encontrado" }, { status: 404 })
        }

        return NextResponse.json(result[0])
      }

      // If it's marking as pending
      if (body.action === "marcar_pendente") {
        console.log("Marking as pending")

        const result = await sql`
          UPDATE debitos 
          SET status = 'pendente',
              data_baixa = NULL,
              observacao_baixa = NULL
          WHERE id = ${id}
          RETURNING id, status
        `

        console.log("Update result:", result)

        if (result.length === 0) {
          return NextResponse.json({ error: "Débito não encontrado" }, { status: 404 })
        }

        return NextResponse.json(result[0])
      }
    } else if (body.action === "marcar_pago" || body.action === "marcar_pendente") {
      // If the column doesn't exist but we're trying to mark paid/pending
      console.log("Status column doesn't exist, migration needed")
      return NextResponse.json(
        {
          error: "Função não disponível. Execute o script de migração do banco de dados primeiro.",
        },
        { status: 400 },
      )
    }

    // Standard update regardless of column presence
    const { cooperado_id, empresa_id, descricao, data, valor } = body
    console.log("Standard update:", { cooperado_id, empresa_id, descricao, data, valor })

    const result = await sql`
      UPDATE debitos 
      SET cooperado_id = ${cooperado_id}, 
          empresa_id = ${empresa_id}, 
          descricao = ${descricao}, 
          data = ${data}::date, 
          valor = ${valor}
      WHERE id = ${id}
      RETURNING id, cooperado_id, empresa_id, descricao, TO_CHAR(data, 'YYYY-MM-DD') as data, valor
    `

    console.log("Update result:", result)

    if (result.length === 0) {
      return NextResponse.json({ error: "Débito não encontrado" }, { status: 404 })
    }

    // If the status column exists, add it to the response
    if (hasStatusColumn) {
      const statusResult = await sql`
        SELECT status, TO_CHAR(data_baixa, 'YYYY-MM-DD') as data_baixa, observacao_baixa
        FROM debitos
        WHERE id = ${id}
      `

      if (statusResult.length > 0) {
        Object.assign(result[0], {
          status: statusResult[0].status,
          data_baixa: statusResult[0].data_baixa,
          observacao_baixa: statusResult[0].observacao_baixa,
        })
      }
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Erro ao atualizar débito:", error)
    console.error("Error details:", error instanceof Error ? error.message : error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    // Check if the status column exists and if the débito is already paid
    const checkColumn = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'debitos' 
      AND column_name = 'status'
    `

    if (checkColumn.length > 0) {
      const statusCheck = await sql`
        SELECT status FROM debitos WHERE id = ${id}
      `

      if (statusCheck.length > 0 && statusCheck[0].status === "pago") {
        return NextResponse.json(
          {
            error: "Não é possível excluir um débito já pago. Marque como pendente primeiro.",
          },
          { status: 400 },
        )
      }
    }

    await sql`
      DELETE FROM debitos 
      WHERE id = ${id}
    `

    return NextResponse.json({ message: "Débito excluído com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir débito:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
