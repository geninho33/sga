import crypto from "crypto";

const stored =
  "K/CQDbnuUL1FTOreejWpE58i8oP2FcK+cxShn/mDzx2u0YzQigc7GFKo2k5Qt0pcyLnZ9UElRJzqZt4h9VZabg==";
const guid = "0c6cca9d-14b1-48a7-9959-6ae6b441bc6c";
const guidNoDash = guid.replace(/-/g, "");

function sha512b64(data) {
  const buf = typeof data === "string" ? Buffer.from(data, "utf8") : data;
  return crypto.createHash("sha512").update(buf).digest("base64");
}

function iterHash(text, salt, iterations, mode) {
  let h;
  if (mode === "concat") h = crypto.createHash("sha512").update(text + salt, "utf8").digest();
  else if (mode === "concatTrim")
    h = crypto.createHash("sha512").update(text.trim() + salt.trim(), "utf8").digest();
  else if (mode === "saltFirst")
    h = crypto.createHash("sha512").update(salt + text, "utf8").digest();
  else if (mode === "onlyPwd") h = crypto.createHash("sha512").update(text, "utf8").digest();
  else if (mode === "hexIter") {
    let digest = sha512b64(text.trim() + salt.trim());
    for (let i = 1; i < iterations; i++) digest = sha512b64(digest);
    return digest;
  } else if (mode === "b64Iter") {
    let digest = sha512b64(text.trim() + salt.trim());
    for (let i = 1; i < iterations; i++) digest = sha512b64(Buffer.from(digest, "base64"));
    return digest;
  } else if (mode === "hexChain") {
    let hex = crypto.createHash("sha512").update(text.trim() + salt.trim(), "utf8").digest("hex").toUpperCase();
    for (let i = 1; i < iterations; i++) {
      hex = crypto.createHash("sha512").update(hex, "utf8").digest("hex").toUpperCase();
    }
    return Buffer.from(hex, "hex").toString("base64");
  } else if (mode === "hexChainLatin1") {
    let hex = crypto.createHash("sha512").update(text.trim() + salt.trim(), "latin1").digest("hex").toUpperCase();
    for (let i = 1; i < iterations; i++) {
      hex = crypto.createHash("sha512").update(hex, "latin1").digest("hex").toUpperCase();
    }
    return Buffer.from(hex, "hex").toString("base64");
  } else if (mode === "pwdOnlyIter") {
    h = crypto.createHash("sha512").update(text.trim(), "utf8").digest();
    for (let i = 1; i < iterations; i++) h = crypto.createHash("sha512").update(h).digest();
    return h.toString("base64");
  } else if (mode === "concatLatin1") {
    h = crypto.createHash("sha512").update(text.trim() + salt.trim(), "latin1").digest();
    for (let i = 1; i < iterations; i++) h = crypto.createHash("sha512").update(h).digest();
    return h.toString("base64");
  } else if (mode === "utf16le") {
    const buf = Buffer.from(text.trim() + salt.trim(), "utf16le");
    h = crypto.createHash("sha512").update(buf).digest();
    for (let i = 1; i < iterations; i++) h = crypto.createHash("sha512").update(h).digest();
    return h.toString("base64");
  }
  for (let i = 1; i < iterations; i++) h = crypto.createHash("sha512").update(h).digest();
  return h.toString("base64");
}

const passwords = process.argv.slice(2);
const testPwds =
  passwords.length > 0
    ? passwords
    : ["123456", "12345", "daniel", "admin", "masterkey", "senha", "password", "1234", "12345678"];
const salts = [guid, guidNoDash, guid.toUpperCase(), ""];
const iters = [1, 10];

for (const pwd of testPwds) {
  for (const salt of salts) {
    for (const n of iters) {
      for (const mode of [
        "concat",
        "concatTrim",
        "saltFirst",
        "onlyPwd",
        "hexIter",
        "b64Iter",
        "hexChain",
        "hexChainLatin1",
        "pwdOnlyIter",
        "concatLatin1",
        "utf16le",
      ]) {
        const h = iterHash(pwd, salt, n, mode);
        if (h === stored) console.log("MATCH", { pwd, salt, n, mode });
      }
    }
  }
}
console.log("done");
