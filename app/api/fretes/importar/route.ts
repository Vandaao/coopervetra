import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"
export const revalidate = 0

const sql = neon(process.env.DATABASE_URL!)

interface LinhaFrete {
  cooperado?: string
  carga?: string
  km?: string | number
  data?: string
  valor?: string | number
  [key: string]: any
}

// Função auxiliar para ler CSV
function parseCSV(content: string): LinhaFrete[] {
  const lines = content.split("\n").filter((line) => line.trim())
  if (lines.length < 2) return []

  // Parse header
  const header = lines[0].split(",").map((col) => col.trim().toLowerCase())

  // Encontrar índices das colunas
  const cooperadoIdx = header.findIndex((h) => h.includes("cooperado"))
  const cargaIdx = header.findIndex((h) => h.includes("carga"))
  const kmIdx = header.findIndex((h) => h.includes("km"))
  const dataIdx = header.findIndex((h) => h.includes("data"))
  const valorIdx = header.findIndex((h) => h.includes("valor"))

  const rows: LinhaFrete[] = []

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map((cell) => cell.trim())

    if (cells.length > 0 && cells.some((cell) => cell)) {
      rows.push({
        cooperado: cooperadoIdx >= 0 ? cells[cooperadoIdx] : "",
        carga: cargaIdx >= 0 ? cells[cargaIdx] : "",
        km: kmIdx >= 0 ? cells[kmIdx] : "0",
        data: dataIdx >= 0 ? cells[dataIdx] : "",
        valor: valorIdx >= 0 ? cells[valorIdx] : "0",
      })
    }
  }

  return rows
}

// Função auxiliar simples para limpar strings
function cleanString(str: string | number | any): string {
  return String(str || "").trim()
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const empresaId = formData.get("empresa_id") as string

    if (!file || !empresaId) {
      return NextResponse.json({ error: "Arquivo e empresa são obrigatórios" }, { status: 400 })
    }

    // Ler o arquivo como texto
    const buffer = await file.arrayBuffer()
    const content = Buffer.from(buffer).toString("utf-8")

    // Aceitar CSV e tentar ler como CSV (Excel também pode ser salvo como CSV UTF-8)
    let rows: LinhaFrete[] = []

    if (file.name.toLowerCase().endsWith(".csv")) {
      rows = parseCSV(content)
    } else {
      // Tentar ler qualquer outro arquivo como CSV (Excel salvo como CSV)
      rows = parseCSV(content)
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "Nenhum frete encontrado na planilha. Verifique o arquivo e certifique-se de que tem dados.", }, { status: 400 })
    }

    const errors: string[] = []
    let imported = 0

    // Buscar todos os cooperados para map de nomes -> IDs
    const cooperados = await sql`SELECT id, nome FROM cooperados`
    const cooperadoMap = new Map()
    cooperados.forEach((c) => {
      cooperadoMap.set(c.nome.toLowerCase(), c.id)
    })

    // Processar cada linha
    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i]
        const linhaNum = i + 2 // +1 para header, +1 para numerar a partir de 1

        // Validação
        if (!row.cooperado || !row.cooperado.trim()) {
          errors.push(`Linha ${linhaNum}: Cooperado não informado`)
          continue
        }

        if (!row.carga || !row.carga.toString().trim()) {
          errors.push(`Linha ${linhaNum}: Carga não informada`)
          continue
        }

        if (!row.km || isNaN(Number(row.km))) {
          errors.push(`Linha ${linhaNum}: KM inválido`)
          continue
        }

        if (!row.data || !row.data.toString().trim()) {
          errors.push(`Linha ${linhaNum}: Data não informada`)
          continue
        }

        if (!row.valor || isNaN(Number(row.valor))) {
          errors.push(`Linha ${linhaNum}: Valor inválido`)
          continue
        }

        // Buscar cooperado
        const cooperadoNormalized = row.cooperado.toLowerCase().trim()
        const cooperadoId = cooperadoMap.get(cooperadoNormalized)

        if (!cooperadoId) {
          errors.push(`Linha ${linhaNum}: Cooperado "${row.cooperado}" não encontrado`)
          continue
        }

        // Formatar data (aceita DD/MM/YYYY ou YYYY-MM-DD)
        let dataFormatada = row.data.toString().trim()
        if (dataFormatada.includes("/")) {
          const [dia, mes, ano] = dataFormatada.split("/")
          dataFormatada = `${ano}-${mes}-${dia}`
        }

        // Validar data
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dataFormatada)) {
          errors.push(`Linha ${linhaNum}: Data em formato inválido. Use DD/MM/YYYY ou YYYY-MM-DD`)
          continue
        }

        // Inserir frete
        await sql`
          INSERT INTO fretes (cooperado_id, empresa_id, carga, km, valor, data)
          VALUES (${cooperadoId}, ${empresaId}, ${row.carga.toString().trim()}, ${Number(row.km)}, ${Number(row.valor)}, ${dataFormatada}::date)
        `

        imported++
      } catch (error) {
        const linhaNum = i + 2
        const errorMsg = error instanceof Error ? error.message : "Erro desconhecido"
        errors.push(`Linha ${linhaNum}: ${errorMsg}`)
      }
    }

    // Se nenhum foi importado, retornar erro
    if (imported === 0) {
      return NextResponse.json(
        {
          error: "Nenhum frete foi importado",
          errors,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      imported,
      errors: errors.length > 0 ? errors : undefined,
      message: `${imported} frete(s) importado(s) com sucesso${errors.length > 0 ? ` (${errors.length} erro(s))` : ""}`,
    })
  } catch (error) {
    console.error("Erro ao importar fretes:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao importar fretes",
      },
      { status: 500 },
    )
  }
}
