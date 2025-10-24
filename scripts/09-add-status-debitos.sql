-- Adicionar campos de controle de pagamento na tabela débitos
-- Execute este script no seu banco de dados Neon

-- Verificar se a tabela débitos existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'debitos') THEN
        RAISE EXCEPTION 'Tabela debitos não existe!';
    END IF;
END $$;

-- Adicionar campo de status (pago ou não pago)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'debitos' AND column_name = 'status') THEN
        ALTER TABLE debitos ADD COLUMN status VARCHAR(20) DEFAULT 'pendente';
        RAISE NOTICE 'Coluna status adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna status já existe';
    END IF;
END $$;

-- Adicionar campo de data de baixa (quando foi pago)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'debitos' AND column_name = 'data_baixa') THEN
        ALTER TABLE debitos ADD COLUMN data_baixa DATE;
        RAISE NOTICE 'Coluna data_baixa adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna data_baixa já existe';
    END IF;
END $$;

-- Adicionar campo de observações da baixa
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'debitos' AND column_name = 'observacao_baixa') THEN
        ALTER TABLE debitos ADD COLUMN observacao_baixa TEXT;
        RAISE NOTICE 'Coluna observacao_baixa adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna observacao_baixa já existe';
    END IF;
END $$;

-- Criar índice para melhor performance nas consultas por status
CREATE INDEX IF NOT EXISTS idx_debitos_status ON debitos(status);

-- Atualizar débitos existentes como pendentes
UPDATE debitos 
SET status = 'pendente'
WHERE status IS NULL;

-- Tornar o campo status obrigatório
ALTER TABLE debitos 
ALTER COLUMN status SET NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN debitos.status IS 'Status do débito: pendente ou pago';
COMMENT ON COLUMN debitos.data_baixa IS 'Data em que o débito foi marcado como pago';
COMMENT ON COLUMN debitos.observacao_baixa IS 'Observações sobre o pagamento do débito';

-- Verificação final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'debitos' 
    AND column_name IN ('status', 'data_baixa', 'observacao_baixa')
ORDER BY column_name;
