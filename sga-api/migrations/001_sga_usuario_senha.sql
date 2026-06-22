-- Tabela exclusiva da API web (não faz parte do KB GeneXus).
-- Senhas bcrypt para login em /api/auth/login.

CREATE TABLE IF NOT EXISTS sga_usuario_senha (
  prefCodigo INT NOT NULL,
  usuCodigo INT NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (prefCodigo, usuCodigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
