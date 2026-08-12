import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS abastecimento_creditos (
      id SERIAL PRIMARY KEY,
      data_credito DATE NOT NULL,
      valor DECIMAL(12,2) NOT NULL,
      saldo_disponivel DECIMAL(12,2) NOT NULL,
      observacao TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS abastecimento_documentos (
      id SERIAL PRIMARY KEY,
      numero_documento VARCHAR(50) NOT NULL,
      data_documento DATE NOT NULL,
      valor DECIMAL(12,2) NOT NULL,
      valor_abatido DECIMAL(12,2) NOT NULL DEFAULT 0,
      valor_pendente DECIMAL(12,2) NOT NULL DEFAULT 0,
      status VARCHAR(20) NOT NULL DEFAULT 'pendente',
      descricao TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS abastecimento_alocacoes (
      id SERIAL PRIMARY KEY,
      documento_id INTEGER NOT NULL REFERENCES abastecimento_documentos(id) ON DELETE CASCADE,
      credito_id INTEGER NOT NULL REFERENCES abastecimento_creditos(id) ON DELETE CASCADE,
      valor DECIMAL(12,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `
}

/**
 * Aloca (abate) saldo de créditos disponíveis (FIFO, mais antigos primeiro)
 * contra um documento específico, até o documento ficar pago ou o crédito
 * disponível se esgotar. Cria os registros de alocação e atualiza os saldos.
 */
async function alocarDocumento(documentoId: number) {
  await ensureTables()

  const documentos = await sql`
    SELECT id, valor_pendente FROM abastecimento_documentos WHERE id = ${documentoId}
  `
  if (documentos.length === 0) return

  let valorPendente = Number(documentos[0].valor_pendente)
  if (valorPendente <= 0) return

  const creditosDisponiveis = await sql`
    SELECT id, saldo_disponivel FROM abastecimento_creditos
    WHERE saldo_disponivel > 0
    ORDER BY data_credito ASC, id ASC
  `

  for (const credito of creditosDisponiveis) {
    if (valorPendente <= 0) break

    const saldoCredito = Number(credito.saldo_disponivel)
    const valorAlocado = Math.min(saldoCredito, valorPendente)
    if (valorAlocado <= 0) continue

    await sql`
      INSERT INTO abastecimento_alocacoes (documento_id, credito_id, valor)
      VALUES (${documentoId}, ${credito.id}, ${valorAlocado})
    `
    await sql`
      UPDATE abastecimento_creditos
      SET saldo_disponivel = saldo_disponivel - ${valorAlocado}
      WHERE id = ${credito.id}
    `

    valorPendente -= valorAlocado
  }

  const valorAbatidoTotal = await sql`
    SELECT COALESCE(SUM(valor), 0) as total FROM abastecimento_alocacoes WHERE documento_id = ${documentoId}
  `
  const totalAbatido = Number(valorAbatidoTotal[0].total)
  const documentoAtual = await sql`
    SELECT valor FROM abastecimento_documentos WHERE id = ${documentoId}
  `
  const valorDocumento = Number(documentoAtual[0].valor)
  const novoPendente = Math.max(0, valorDocumento - totalAbatido)

  await sql`
    UPDATE abastecimento_documentos
    SET valor_abatido = ${totalAbatido},
        valor_pendente = ${novoPendente},
        status = ${novoPendente <= 0.005 ? "pago" : "pendente"}
    WHERE id = ${documentoId}
  `
}

/**
 * Após lançar um novo crédito, baixa automaticamente os documentos
 * pendentes mais antigos primeiro (FIFO), na ordem de data do documento.
 */
export async function alocarPendenciasAposNovoCredito() {
  const pendentes = await sql`
    SELECT id FROM abastecimento_documentos
    WHERE status = 'pendente'
    ORDER BY data_documento ASC, id ASC
  `

  for (const documento of pendentes) {
    await alocarDocumento(documento.id)
  }
}

export async function alocarDocumentoNovo(documentoId: number) {
  await alocarDocumento(documentoId)
}

export { ensureTables as ensureAbastecimentoTables }
