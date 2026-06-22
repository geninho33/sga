-- Permissões de menu por perfil (GAM RoleId)
CREATE TABLE IF NOT EXISTS sga_role_menu (
  RoleId INT NOT NULL,
  menu_id VARCHAR(80) NOT NULL,
  PRIMARY KEY (RoleId, menu_id),
  INDEX idx_sga_role_menu_role (RoleId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
