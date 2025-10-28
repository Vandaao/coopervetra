-- Adicionar colunas de status e data de pagamento na tabela fretes
ALTER TABLE fretes 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS data_pagamento DATE;

-- Criar índice para melhor performance nas consultas por status
CREATE INDEX IF NOT EXISTS idx_fretes_status ON fretes(status);

-- Comentários para documentação
COMMENT ON COLUMN fretes.status IS 'Status do pagamento: pendente ou pago';
COMMENT ON COLUMN fretes.data_pagamento IS 'Data em que o frete foi marcado como pago';
