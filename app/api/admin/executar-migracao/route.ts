import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    // Verificar se o usuário está autenticado como admin
    // Nota: Na implementação real, deve-se adicionar verificação de autenticação

    // Verificar se as colunas já existem
    const checkColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'debitos' 
      AND column_name IN ('status', 'data_baixa', 'observacao_baixa')
    `

    if (checkColumns.length === 3) {
      return NextResponse.json({
        message: "As colunas já existem no banco de dados.",
        alreadyExists: true,
      })
    }

    // Adicionar campo de status (pago ou não pago)
    await sql`
      ALTER TABLE debitos 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pendente'
    `

    // Adicionar campo de data de baixa (quando foi pago)
    await sql`
      ALTER TABLE debitos 
      ADD COLUMN IF NOT EXISTS data_baixa DATE
    `

    // Adicionar campo de observações da baixa
    await sql`
      ALTER TABLE debitos 
      ADD COLUMN IF NOT EXISTS observacao_baixa TEXT
    `

    // Criar índice para melhor performance nas consultas por status
    await sql`
      CREATE INDEX IF NOT EXISTS idx_debitos_status ON debitos(status)
    `

    // Atualizar débitos existentes como pendentes
    await sql`
      UPDATE debitos 
      SET status = 'pendente'
      WHERE status IS NULL
    `

    // Tornar o campo status obrigatório
    await sql`
      ALTER TABLE debitos 
      ALTER COLUMN status SET NOT NULL
    `

    return NextResponse.json({
      success: true,
      message: "Migração executada com sucesso. As colunas de status, data_baixa e observacao_baixa foram adicionadas.",
    })
  } catch (error) {
    console.error("Erro ao executar migração:", error)
    return NextResponse.json(
      {
        error: "Erro ao executar migração",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
