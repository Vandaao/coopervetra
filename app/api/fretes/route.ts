import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function checkMigrationNeeded() {
  try {
    await sql`SELECT status FROM fretes LIMIT 1`
    return false
  } catch (error: any) {
    if (error.message?.includes("column") && error.message?.includes("status")) {
      return true
    }
    throw error
  }
}

async function runMigration() {
  try {
    await sql`
      ALTER TABLE fretes 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pendente',
      ADD COLUMN IF NOT EXISTS data_pagamento DATE
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_fretes_status ON fretes(status)
    `

    return true
  } catch (error) {
    console.error("Erro ao executar migração:", error)
    throw error
  }
}

export async function GET() {
  try {
    const needsMigration = await checkMigrationNeeded()

    if (needsMigration) {
      console.log("[v0] Migração necessária, executando...")
      await runMigration()
      console.log("[v0] Migração executada com sucesso")
    }

    const fretes = await sql`
      SELECT 
        f.id,
        f.carga,
        f.km,
        f.valor,
        f.chapada,
        TO_CHAR(f.data, 'YYYY-MM-DD') as data,
        COALESCE(f.status, 'pendente') as status,
        TO_CHAR(f.data_pagamento, 'YYYY-MM-DD') as data_pagamento,
        c.nome as cooperado_nome,
        e.nome as empresa_nome
      FROM fretes f
      JOIN cooperados c ON f.cooperado_id = c.id
      JOIN empresas e ON f.empresa_id = e.id
      ORDER BY f.data DESC
    `

    // Converter valores para números
    const fretesFormatados = fretes.map((frete) => ({
      ...frete,
      valor: Number(frete.valor),
      chapada: Number(frete.chapada),
      km: Number(frete.km),
    }))

    return NextResponse.json(fretesFormatados, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    })
  } catch (error) {
    console.error("Erro ao buscar fretes:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { cooperado_id, empresa_id, carga, km, valor, chapada, data } = await request.json()

    const result = await sql`
      INSERT INTO fretes (cooperado_id, empresa_id, carga, km, valor, chapada, data)
      VALUES (${cooperado_id}, ${empresa_id}, ${carga}, ${km}, ${valor}, ${chapada}, ${data}::date)
      RETURNING id
    `

    return NextResponse.json(result[0], {
      status: 201,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    })
  } catch (error) {
    console.error("Erro ao criar frete:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
