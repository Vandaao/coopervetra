import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("Iniciando backup dos dados...")

    // Buscar todos os cooperados
    const cooperados = await sql`
      SELECT * FROM cooperados ORDER BY id
    `

    // Buscar todas as empresas
    const empresas = await sql`
      SELECT * FROM empresas ORDER BY id
    `

    // Buscar todos os fretes
    const fretes = await sql`
      SELECT 
        f.id,
        f.cooperado_id,
        f.empresa_id,
        f.carga,
        f.km,
        f.valor,
        f.chapada,
        TO_CHAR(f.data, 'YYYY-MM-DD') as data,
        f.created_at
      FROM fretes f
      ORDER BY f.id
    `

    // Buscar todos os débitos
    const debitos = await sql`
      SELECT 
        d.id,
        d.cooperado_id,
        d.empresa_id,
        d.descricao,
        TO_CHAR(d.data, 'YYYY-MM-DD') as data,
        d.valor,
        d.created_at
      FROM debitos d
      ORDER BY d.id
    `

    // Buscar todos os usuários (sem senhas)
    const usuarios = await sql`
      SELECT 
        id,
        username,
        nome,
        tipo,
        ativo,
        created_at,
        updated_at
      FROM usuarios
      ORDER BY id
    `

    // Criar objeto de backup
    const backup = {
      metadata: {
        backup_date: new Date().toISOString(),
        version: "1.0",
        system: "Coopervetra - Sistema de Fretes",
      },
      statistics: {
        total_cooperados: cooperados.length,
        total_empresas: empresas.length,
        total_fretes: fretes.length,
        total_debitos: debitos.length,
        total_usuarios: usuarios.length,
      },
      data: {
        cooperados: cooperados.map((c) => ({
          id: c.id,
          nome: c.nome,
          cpf: c.cpf,
          placa: c.placa,
          conta_bancaria: c.conta_bancaria,
          created_at: c.created_at,
        })),
        empresas: empresas.map((e) => ({
          id: e.id,
          nome: e.nome,
          cnpj: e.cnpj,
          created_at: e.created_at,
        })),
        fretes: fretes.map((f) => ({
          id: f.id,
          cooperado_id: f.cooperado_id,
          empresa_id: f.empresa_id,
          carga: f.carga,
          km: Number(f.km),
          valor: Number(f.valor),
          chapada: Number(f.chapada),
          data: f.data,
          created_at: f.created_at,
        })),
        debitos: debitos.map((d) => ({
          id: d.id,
          cooperado_id: d.cooperado_id,
          empresa_id: d.empresa_id,
          descricao: d.descricao,
          data: d.data,
          valor: Number(d.valor),
          created_at: d.created_at,
        })),
        usuarios: usuarios.map((u) => ({
          id: u.id,
          username: u.username,
          nome: u.nome,
          tipo: u.tipo,
          ativo: u.ativo,
          created_at: u.created_at,
          updated_at: u.updated_at,
        })),
      },
    }

    console.log("Backup concluído com sucesso")
    console.log("Estatísticas:", backup.statistics)

    return NextResponse.json(backup)
  } catch (error) {
    console.error("Erro ao gerar backup:", error)
    return NextResponse.json({ error: "Erro interno ao gerar backup" }, { status: 500 })
  }
}
