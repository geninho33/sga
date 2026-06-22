import crypto from "crypto";

/**
 * Hash de senha GAM (UserPwdEncryption = sh5).
 * Compatível com CryptoSHA.SHA512(texto, salt=UserGUID, iterações).
 */
export function hashGamPassword(password, userGuid, iterations = 10) {
  const salt = String(userGuid || "").trim();
  const text = String(password || "").trim();
  let digest = crypto.createHash("sha512").update(text + salt, "utf8").digest();

  for (let i = 1; i < iterations; i += 1) {
    digest = crypto.createHash("sha512").update(digest).digest();
  }

  return digest.toString("base64");
}

export function verifyGamPassword(password, storedHash, userGuid, iterations = 10) {
  if (!storedHash || !userGuid) return false;
  const computed = hashGamPassword(password, userGuid, iterations);
  return timingSafeEqualString(computed, storedHash.trim());
}

function timingSafeEqualString(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
