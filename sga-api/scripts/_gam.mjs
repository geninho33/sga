import { gamPool } from "../src/db.js";
const [cols] = await gamPool.query("SHOW COLUMNS FROM usermemrole");
console.log("usermemrole", cols.map((c) => c.Field));
const [sample] = await gamPool.query("SELECT * FROM usermemrole LIMIT 2");
console.log(sample);
process.exit(0);
