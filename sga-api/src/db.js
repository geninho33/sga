import "dotenv/config";
import mysql from "mysql2/promise";
import { config } from "./config.js";

function createPool(database) {
  return mysql.createPool({
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
  });
}

export const pool = createPool(config.mysql.database);
export const gamPool = createPool(config.mysql.gamDatabase);
