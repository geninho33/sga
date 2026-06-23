import "dotenv/config";

export const config = {
  port: Number(process.env.PORT) || 3001,
  mysql: {
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "sgealiesc_2023",
    gamDatabase: process.env.MYSQL_GAM_DATABASE || "sgealiesc_gam_2023",
  },
  jwtSecret: process.env.JWT_SECRET || "sga-dev-secret-change-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  gamPasswordIterations: Number(process.env.GAM_PASSWORD_ITERATIONS) || 10,
  gxEncryptKey: process.env.GX_ENCRYPT_KEY || "",
  authAllowPlain: process.env.AUTH_ALLOW_PLAIN === "true",
};
