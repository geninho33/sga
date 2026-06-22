import "dotenv/config";
import { ensureAuthTables } from "../src/services/authSchema.js";
import { ensureSuperUsuarioProfile } from "../src/services/superUsuarioSeed.js";

const login = process.argv[2] || "admin";

await ensureAuthTables();

const result = await ensureSuperUsuarioProfile({ login });
if (result.error) {
  console.error(result.error);
  process.exit(1);
}

console.log(`Perfil "${result.roleName}" (RoleId ${result.roleId}) com ${result.menuCount} menus.`);
console.log(`Usuário ${result.login} (${result.userGuid}) — perfis: ${result.roleIds.join(", ")}.`);
