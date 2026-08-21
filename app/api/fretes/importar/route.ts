import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { read, utils } from "xlsx"
import { encontrarCooperadoMaisProximo, type CooperadoParaComparacao } from "@/lib/cooperado-name-matcher"

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

// Converte um valor de data do Excel (Date, serial ou texto) para DD/MM/AAAA.
function normalizarData(valor: unknown): string {
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    const dia = String(valor.getUTCDate()).padStart(2, "0")
    const mes = String(valor.getUTCMonth() + 1).padStart(2, "0")
    return `${dia}/${mes}/${valor.getUTCFullYear()}`
  }
  return String(valor ?? "").trim()
}

// Lê a planilha Excel no padrão da Coopervetra: aba com cabeçalho
// Cooperado | Carga | KM | Data | Valor, localizando o cabeçalho onde estiver.
function parseXLSX(buffer: ArrayBuffer): LinhaFrete[] {
  const workbook = read(Buffer.from(buffer), { cellDates: true })
  const sheetName =
    workbook.SheetNames.find((nome) => nome.toLowerCase().includes("frete")) || workbook.SheetNames[0]
  if (!sheetName) return []

  const linhas = utils.sheet_to_json<any[]>(workbook.Sheets[sheetName], {
    header: 1,
    blankrows: false,
    raw: true,
  })
  if (linhas.length === 0) return []

  const contemColuna = (linha: any[], termo: string) =>
    linha.some((celula) => String(celula ?? "").trim().toLowerCase().includes(termo))

  // Localiza a linha de cabeçalho (por padrão a primeira, mas resiliente a linhas extras no topo).
  let headerIndex = linhas.findIndex(
    (linha) => contemColuna(linha, "cooperado") && contemColuna(linha, "valor"),
  )
  if (headerIndex === -1) headerIndex = 0

  const header = linhas[headerIndex].map((coluna) => String(coluna ?? "").trim().toLowerCase())
  const cooperadoIdx = header.findIndex((h) => h.includes("cooperado"))
  const cargaIdx = header.findIndex((h) => h.includes("carga"))
  const kmIdx = header.findIndex((h) => h.includes("km"))
  const dataIdx = header.findIndex((h) => h.includes("data"))
  const valorIdx = header.findIndex((h) => h.includes("valor"))

  const rows: LinhaFrete[] = []
  for (let i = headerIndex + 1; i < linhas.length; i++) {
    const celulas = linhas[i]
    if (!celulas || celulas.every((celula) => String(celula ?? "").trim() === "")) continue

    rows.push({
      cooperado: cooperadoIdx >= 0 ? String(celulas[cooperadoIdx] ?? "").trim() : "",
      carga: cargaIdx >= 0 ? String(celulas[cargaIdx] ?? "").trim() : "",
      km: kmIdx >= 0 ? celulas[kmIdx] ?? "0" : "0",
      data: dataIdx >= 0 ? normalizarData(celulas[dataIdx]) : "",
      valor: valorIdx >= 0 ? celulas[valorIdx] ?? "0" : "0",
    })
  }

  return rows
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const empresaId = formData.get("empresa_id") as string

    if (!file || !empresaId) {
      return NextResponse.json({ error: "Arquivo e empresa são obrigatórios" }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const nomeArquivo = file.name.toLowerCase()

    // Excel (.xlsx/.xls) é binário e deve ser lido com SheetJS; CSV continua sendo lido como texto.
    let rows: LinhaFrete[] = []
    if (nomeArquivo.endsWith(".xlsx") || nomeArquivo.endsWith(".xls")) {
      rows = parseXLSX(buffer)
    } else {
      const content = Buffer.from(buffer).toString("utf-8")
      rows = parseCSV(content)
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "Nenhum frete encontrado na planilha. Verifique o arquivo e certifique-se de que tem dados.", }, { status: 400 })
    }

    const errors: string[] = []
    const matchesAproximados: Array<{
      linha: number
      informado: string
      cadastrado: string
      similaridade: number
    }> = []
    let imported = 0

    // Carrega os cooperados uma única vez e compara os nomes de forma normalizada/aproximada.
    const cooperadosResultado = await sql`SELECT id, nome FROM cooperados ORDER BY nome`
    const cooperados: CooperadoParaComparacao[] = cooperadosResultado.map((cooperado) => ({
      id: Number(cooperado.id),
      nome: String(cooperado.nome),
    }))

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

        // KM pode ser zero (cargas na mesma localidade), então validamos apenas número não negativo.
        const kmNumero = Number(row.km)
        if (row.km === "" || row.km === null || row.km === undefined || isNaN(kmNumero) || kmNumero < 0) {
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

        // Buscar o cadastro exato ou o cooperado mais próximo, com proteção contra ambiguidades.
        const resultadoCooperado = encontrarCooperadoMaisProximo(row.cooperado, cooperados)

        if (resultadoCooperado.status === "not_found") {
          const sugestoes = resultadoCooperado.candidatos
            .filter((candidato) => candidato.score >= 0.5)
            .map((candidato) => `${candidato.cooperado.nome} (${Math.round(candidato.score * 100)}%)`)
            .join(", ")

          errors.push(
            `Linha ${linhaNum}: Cooperado "${row.cooperado}" não encontrado${
              sugestoes ? `. Mais próximos: ${sugestoes}` : ""
            }`,
          )
          continue
        }

        if (resultadoCooperado.status === "ambiguous") {
          const sugestoes = resultadoCooperado.candidatos
            .map((candidato) => `${candidato.cooperado.nome} (${Math.round(candidato.score * 100)}%)`)
            .join(", ")

          errors.push(
            `Linha ${linhaNum}: O nome "${row.cooperado}" ficou ambíguo. Possíveis cadastros: ${sugestoes}. Ajuste o nome na planilha.`,
          )
          continue
        }

        const cooperadoId = resultadoCooperado.cooperado.id

        if (resultadoCooperado.aproximado) {
          matchesAproximados.push({
            linha: linhaNum,
            informado: row.cooperado.trim(),
            cadastrado: resultadoCooperado.cooperado.nome,
            similaridade: Math.round(resultadoCooperado.score * 100),
          })
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
          VALUES (${cooperadoId}, ${empresaId}, ${row.carga.toString().trim()}, ${kmNumero}, ${Number(row.valor)}, ${dataFormatada}::date)
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
      matchesAproximados: matchesAproximados.length > 0 ? matchesAproximados : undefined,
      message: `${imported} frete(s) importado(s) com sucesso${
        matchesAproximados.length > 0 ? ` (${matchesAproximados.length} nome(s) associado(s) por aproximação)` : ""
      }${errors.length > 0 ? ` (${errors.length} erro(s))` : ""}`,
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
