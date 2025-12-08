-- Script para adicionar campo de status (ativo/inativo) na tabela de cooperados
-- Execute este script no banco de dados

ALTER TABLE cooperados ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;

-- Atualizar todos os cooperados existentes como ativos
UPDATE cooperados SET ativo = TRUE WHERE ativo IS NULL;
