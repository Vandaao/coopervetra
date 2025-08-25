import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const { nome, cpf, placa, conta_bancaria } = await request.json()

    const result = await sql`
      UPDATE cooperados 
      SET nome = ${nome}, cpf = ${cpf}, placa = ${placa}, conta_bancaria = ${conta_bancaria || null}
      WHERE id = ${id}
      RETURNING id, nome, cpf, placa, conta_bancaria
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Cooperado não encontrado" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Erro ao atualizar cooperado:", error)
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json({ error: "CPF já existe para outro cooperado" }, { status: 400 })
    }
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    await sql`
      DELETE FROM cooperados 
      WHERE id = ${id}
    `

    return NextResponse.json({ message: "Cooperado excluído com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir cooperado:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
