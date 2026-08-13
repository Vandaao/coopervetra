-- Tabela Faturamento (Boletos)
CREATE TABLE IF NOT EXISTS faturamento (
    id SERIAL PRIMARY KEY,
    cliente VARCHAR(255) NOT NULL,
    documento_referencia VARCHAR(50),
    data_emissao DATE NOT NULL,
    data_vencimento DATE NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    observacao TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente', -- pendente, pago, cancelado
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_faturamento_data_emissao ON faturamento(data_emissao);
CREATE INDEX IF NOT EXISTS idx_faturamento_data_vencimento ON faturamento(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_faturamento_status ON faturamento(status);
CREATE INDEX IF NOT EXISTS idx_faturamento_cliente ON faturamento(cliente);
