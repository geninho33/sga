CREATE TABLE IF NOT EXISTS sga_atendimento_doenca (
  prefCodigo INT NOT NULL,
  AtendimentoCodigo INT NOT NULL,
  doenCodigo INT NOT NULL,
  qtdeDomingo DECIMAL(12, 2) NOT NULL DEFAULT 0,
  qtdeSegunda DECIMAL(12, 2) NOT NULL DEFAULT 0,
  qtdeTerca DECIMAL(12, 2) NOT NULL DEFAULT 0,
  qtdeQuarta DECIMAL(12, 2) NOT NULL DEFAULT 0,
  qtdeQuinta DECIMAL(12, 2) NOT NULL DEFAULT 0,
  qtdeSexta DECIMAL(12, 2) NOT NULL DEFAULT 0,
  qtdeSabado DECIMAL(12, 2) NOT NULL DEFAULT 0,
  PRIMARY KEY (prefCodigo, AtendimentoCodigo, doenCodigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
