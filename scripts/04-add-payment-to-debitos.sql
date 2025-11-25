-- Adiciona colunas de controle de pagamento na tabela de débitos

-- Adiciona coluna de status (pendente ou pago)
ALTER TABLE debitos 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pendente';

-- Adiciona coluna de data de pagamento
ALTER TABLE debitos 
ADD COLUMN IF NOT EXISTS data_pagamento DATE;

-- Cria índice para melhorar performance de consultas por status
CREATE INDEX IF NOT EXISTS idx_debitos_status ON debitos(status);

-- Atualiza débitos existentes para status pendente
UPDATE debitos 
SET status = 'pendente' 
WHERE status IS NULL;
