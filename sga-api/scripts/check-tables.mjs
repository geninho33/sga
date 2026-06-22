import { pool } from "../src/db.js";
const [t] = await pool.query("SHOW TABLES LIKE '%per%'");
console.log(t.map((x) => Object.values(x)[0]));
process.exit(0);
