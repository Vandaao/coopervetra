import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    await sql`
      DELETE FROM empresas 
      WHERE id = ${id}
    `

    return NextResponse.json({ message: "Empresa excluída com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir empresa:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
