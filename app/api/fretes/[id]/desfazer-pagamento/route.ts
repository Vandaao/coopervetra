import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    console.log("[v0] Desfazendo pagamento do frete:", id)

    // Atualizar status e remover data de pagamento
    await sql`
      UPDATE fretes 
      SET status = 'pendente', 
          data_pagamento = NULL
      WHERE id = ${id}
    `

    console.log("[v0] Pagamento desfeito com sucesso")

    return Response.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Erro ao desfazer pagamento:", error)
    return Response.json({ error: error.message || "Erro ao desfazer pagamento" }, { status: 500 })
  }
}
