-- Adicionar coluna empresa_id na tabela débitos
ALTER TABLE debitos 
ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_debitos_empresa ON debitos(empresa_id);

-- Atualizar débitos existentes com empresa padrão (primeira empresa)
UPDATE debitos 
SET empresa_id = (SELECT id FROM empresas ORDER BY id LIMIT 1)
WHERE empresa_id IS NULL;

-- Tornar o campo obrigatório após atualizar os registros existentes
ALTER TABLE debitos 
ALTER COLUMN empresa_id SET NOT NULL;
