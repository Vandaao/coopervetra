-- Controle de Abastecimento (Crédito Posto Modelo)
-- Créditos/adiantamentos recebidos, documentos de abastecimento lançados,
-- e histórico de alocação (qual crédito pagou qual documento).

CREATE TABLE IF NOT EXISTS abastecimento_creditos (
    id SERIAL PRIMARY KEY,
    data_credito DATE NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    saldo_disponivel DECIMAL(12,2) NOT NULL,
    observacao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS abastecimento_documentos (
    id SERIAL PRIMARY KEY,
    numero_documento VARCHAR(50) NOT NULL,
    data_documento DATE NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    valor_abatido DECIMAL(12,2) NOT NULL DEFAULT 0,
    valor_pendente DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente', -- pendente, pago
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS abastecimento_alocacoes (
    id SERIAL PRIMARY KEY,
    documento_id INTEGER NOT NULL REFERENCES abastecimento_documentos(id) ON DELETE CASCADE,
    credito_id INTEGER NOT NULL REFERENCES abastecimento_creditos(id) ON DELETE CASCADE,
    valor DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_abastecimento_documentos_status ON abastecimento_documentos(status);
CREATE INDEX IF NOT EXISTS idx_abastecimento_creditos_data ON abastecimento_creditos(data_credito);
CREATE INDEX IF NOT EXISTS idx_abastecimento_alocacoes_documento ON abastecimento_alocacoes(documento_id);
CREATE INDEX IF NOT EXISTS idx_abastecimento_alocacoes_credito ON abastecimento_alocacoes(credito_id);
