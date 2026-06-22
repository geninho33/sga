import { pool } from "../src/db.js";

const [t] = await pool.query("SHOW TABLES LIKE '%mapa%'");
console.log("mapa", t.map((x) => Object.values(x)[0]));
const [d] = await pool.query("SHOW TABLES LIKE '%dist%'");
console.log("dist", d.map((x) => Object.values(x)[0]));
const [p] = await pool.query("SHOW TABLES LIKE '%perres%'");
console.log("perres", p.map((x) => Object.values(x)[0]));
process.exit(0);
