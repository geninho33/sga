import bcrypt from "bcrypt";
import { decrypt64 } from "gx-twofish64";
import { config } from "../config.js";

export function isBcryptHash(value) {
  return typeof value === "string" && /^\$2[aby]\$/.test(value);
}

export async function verifyBcryptPassword(password, hash) {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

export function hashBcryptPassword(password, rounds = 10) {
  return bcrypt.hash(password, rounds);
}

/**
 * Senha legada em trnsusuarios.usuSenha (Encrypt64 / Twofish).
 * Requer GX_ENCRYPT_KEY no .env.
 */
export function verifyEncrypt64Password(password, encrypted, hexKey = config.gxEncryptKey) {
  if (!encrypted || !hexKey) return false;
  try {
    const decrypted = decrypt64(String(encrypted).trim(), hexKey);
    return decrypted.trim() === String(password).trim();
  } catch {
    return false;
  }
}
