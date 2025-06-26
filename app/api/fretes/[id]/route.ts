import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    await sql`
      DELETE FROM fretes 
      WHERE id = ${id}
    `

    return NextResponse.json({ message: "Frete excluído com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir frete:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
