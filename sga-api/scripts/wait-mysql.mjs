import mysql from "mysql2/promise";
import { config } from "../src/config.js";

const max = Number(process.env.MYSQL_WAIT_RETRIES) || 60;
const delayMs = Number(process.env.MYSQL_WAIT_DELAY_MS) || 2000;

for (let i = 1; i <= max; i++) {
  try {
    const conn = await mysql.createConnection({
      host: config.mysql.host,
      port: config.mysql.port,
      user: config.mysql.user,
      password: config.mysql.password,
      database: config.mysql.database,
      connectTimeout: 5000,
    });
    await conn.ping();
    await conn.end();
    console.log(
      `[wait-mysql] OK — ${config.mysql.host}:${config.mysql.port}/${config.mysql.database}`
    );
    process.exit(0);
  } catch (err) {
    console.log(`[wait-mysql] ${i}/${max} — ${err.message}`);
    if (i < max) await new Promise((r) => setTimeout(r, delayMs));
  }
}

console.error("[wait-mysql] MySQL indisponível após todas as tentativas.");
console.error(
  `[wait-mysql] Verifique deploy/.env — host=${config.mysql.host} port=${config.mysql.port} db=${config.mysql.database}`
);
process.exit(1);
