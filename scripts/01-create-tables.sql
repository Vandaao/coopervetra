-- Criação das tabelas do sistema de fretes

-- Tabela Cooperados
CREATE TABLE IF NOT EXISTS cooperados (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    placa VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela Empresas
CREATE TABLE IF NOT EXISTS empresas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela Débitos
CREATE TABLE IF NOT EXISTS debitos (
    id SERIAL PRIMARY KEY,
    descricao TEXT NOT NULL,
    data DATE NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    cooperado_id INTEGER REFERENCES cooperados(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela Fretes
CREATE TABLE IF NOT EXISTS fretes (
    id SERIAL PRIMARY KEY,
    cooperado_id INTEGER REFERENCES cooperados(id) ON DELETE CASCADE,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
    carga VARCHAR(255) NOT NULL,
    km INTEGER NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    chapada DECIMAL(10,2) NOT NULL DEFAULT 0,
    data DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_debitos_data ON debitos(data);
CREATE INDEX IF NOT EXISTS idx_debitos_cooperado ON debitos(cooperado_id);
CREATE INDEX IF NOT EXISTS idx_fretes_data ON fretes(data);
CREATE INDEX IF NOT EXISTS idx_fretes_cooperado ON fretes(cooperado_id);
