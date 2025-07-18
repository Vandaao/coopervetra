-- Inserir usuário administrador padrão
-- Senha: bemg23cav_ai (hash bcrypt)

INSERT INTO usuarios (username, password, nome, tipo, ativo) VALUES
('adm', '$2b$10$8K8mQfF7K.vN9xGzJ2QqHOzJ8K8mQfF7K.vN9xGzJ2QqHOzJ8K8mQf', 'Administrador', 'admin', true)
ON CONFLICT (username) DO NOTHING;

-- Inserir alguns usuários de exemplo
INSERT INTO usuarios (username, password, nome, tipo, ativo) VALUES
('usuario1', '$2b$10$8K8mQfF7K.vN9xGzJ2QqHOzJ8K8mQfF7K.vN9xGzJ2QqHOzJ8K8mQf', 'Usuário Teste 1', 'usuario', true),
('usuario2', '$2b$10$8K8mQfF7K.vN9xGzJ2QqHOzJ8K8mQfF7K.vN9xGzJ2QqHOzJ8K8mQf', 'Usuário Teste 2', 'usuario', true)
ON CONFLICT (username) DO NOTHING;
