-- Alterar campo conta bancária para texto maior e não obrigatório

ALTER TABLE cooperados 
ALTER COLUMN conta_bancaria TYPE TEXT;

-- Remover constraint NOT NULL se existir
ALTER TABLE cooperados 
ALTER COLUMN conta_bancaria DROP NOT NULL;

-- Atualizar exemplos com informações mais completas
UPDATE cooperados SET conta_bancaria = 'PIX: (32) 99999-1111 | Banco do Brasil - Ag: 1234 - CC: 12345-6' WHERE id = 1;
UPDATE cooperados SET conta_bancaria = 'PIX: joao@email.com | Caixa Econômica - Ag: 5678 - CP: 78901-2' WHERE id = 2;
UPDATE cooperados SET conta_bancaria = 'PIX: 123.456.789-01 | Itaú - Ag: 9012 - CC: 34567-8' WHERE id = 3;
