-- Adicionar campo conta bancária na tabela cooperados

ALTER TABLE cooperados 
ADD COLUMN IF NOT EXISTS conta_bancaria VARCHAR(50);

-- Atualizar cooperados existentes com contas de exemplo
UPDATE cooperados SET conta_bancaria = '12345-6' WHERE id = 1;
UPDATE cooperados SET conta_bancaria = '78901-2' WHERE id = 2;
UPDATE cooperados SET conta_bancaria = '34567-8' WHERE id = 3;
