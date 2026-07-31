-- Tabela de Clientes para Faturamento
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_clientes_cnpj ON clientes(cnpj);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);

-- Alterar tabela faturamento para referenciar cliente_id
ALTER TABLE faturamento 
ADD COLUMN cliente_id INTEGER REFERENCES clientes(id) ON DELETE RESTRICT;

-- Atualizar índice de cliente
DROP INDEX IF EXISTS idx_faturamento_cliente;
CREATE INDEX IF NOT EXISTS idx_faturamento_cliente_id ON faturamento(cliente_id);
