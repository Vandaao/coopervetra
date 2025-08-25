-- Inserir usuário administrador padrão
-- Senha: bemg23cav_ai (usando hash simples para teste)

INSERT INTO usuarios (username, password, nome, tipo, ativo) VALUES
('adm', 'YmVtZzIzY2F2X2Fp', 'Administrador', 'admin', true)
ON CONFLICT (username) DO NOTHING;

-- Inserir alguns usuários de exemplo
INSERT INTO usuarios (username, password, nome, tipo, ativo) VALUES
('usuario1', 'YmVtZzIzY2F2X2Fp', 'Usuário Teste 1', 'usuario', true),
('usuario2', 'YmVtZzIzY2F2X2Fp', 'Usuário Teste 2', 'usuario', true)
ON CONFLICT (username) DO NOTHING;
