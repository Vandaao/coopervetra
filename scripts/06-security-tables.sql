-- Tabela para logs de acesso e auditoria
CREATE TABLE IF NOT EXISTS logs_acesso (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id),
  username VARCHAR(50),
  ip VARCHAR(45),
  acao VARCHAR(50),
  sucesso BOOLEAN DEFAULT false,
  detalhes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_logs_acesso_usuario ON logs_acesso(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_acesso_created ON logs_acesso(created_at);
CREATE INDEX IF NOT EXISTS idx_logs_acesso_acao ON logs_acesso(acao);

-- Tabela para sessões ativas
CREATE TABLE IF NOT EXISTS sessoes_ativas (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  ip VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario ON sessoes_ativas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_expires ON sessoes_ativas(expires_at);

-- Limpa sessões expiradas (executar periodicamente)
DELETE FROM sessoes_ativas WHERE expires_at < NOW();
