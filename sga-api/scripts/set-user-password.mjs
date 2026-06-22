import "dotenv/config";
import { pool } from "../src/db.js";
import { ensureAuthTables } from "../src/services/authSchema.js";
import { hashBcryptPassword } from "../src/services/legacyPassword.js";

const usuario = process.argv[2];
const senha = process.argv[3];

if (!usuario || !senha) {
  console.error("Uso: node scripts/set-user-password.mjs <usuario> <senha>");
  process.exit(1);
}

await ensureAuthTables();
const hash = await hashBcryptPassword(senha);

const [users] = await pool.query(
  `SELECT prefCodigo, usuCodigo, usuNome
   FROM trnsusuarios
   WHERE LOWER(TRIM(usuUsuario)) = LOWER(TRIM(:usuario))
     AND usuStatus = 'A'`,
  { usuario }
);

if (!users.length) {
  console.error(`Nenhum usuário ativo encontrado com login "${usuario}".`);
  process.exit(1);
}

for (const user of users) {
  await pool.query(
    `INSERT INTO sga_usuario_senha (prefCodigo, usuCodigo, senha_hash)
     VALUES (:prefCodigo, :usuCodigo, :hash)
     ON DUPLICATE KEY UPDATE senha_hash = VALUES(senha_hash)`,
    { prefCodigo: user.prefCodigo, usuCodigo: user.usuCodigo, hash }
  );
  console.log(
    `Senha definida para ${user.usuNome?.trim()} (pref ${user.prefCodigo}, usu ${user.usuCodigo}).`
  );
}
