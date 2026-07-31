CREATE TABLE IF NOT EXISTS taxas_descontos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL UNIQUE,
  percentual DECIMAL(5,2) NOT NULL,
  descricao VARCHAR(500),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir taxas padrão
INSERT INTO taxas_descontos (nome, percentual, descricao, ativo) VALUES
  ('INSS', 4.50, 'Desconto INSS - 4,5%', true),
  ('Administrativo', 6.00, 'Taxa Administrativa - 6%', true)
ON CONFLICT (nome) DO NOTHING;
