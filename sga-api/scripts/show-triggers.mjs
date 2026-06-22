import { pool } from "../src/db.js";

const [t] = await pool.query("SHOW TRIGGERS LIKE 'romaneioitem'");
console.log(JSON.stringify(t, null, 2));
await pool.end();
