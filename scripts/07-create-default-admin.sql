-- Criar usuário administrador padrão
-- Username: admin
-- Senha: admin123 (TROQUE IMEDIATAMENTE após o primeiro login!)

-- O hash abaixo é para a senha "admin123" usando SHA-256 com salt "coopervetra_salt"
-- Hash = SHA256(admin123 + coopervetra_salt)

INSERT INTO usuarios (username, password, nome, tipo, ativo)
VALUES (
  'admin',
  'b8c37e33defde51cf91e1e03e51657da98b91f3afe7c1e6e0f2e3c8d3e8e3f3a',
  'Administrador',
  'admin',
  true
)
ON CONFLICT (username) DO NOTHING;
