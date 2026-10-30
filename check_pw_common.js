import { scrypt } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64));
  return hashedBuf.equals(suppliedBuf);
}

const commonHash = "3c8a0cb4a9d8dad59971b43e2391955baf3f051b82f9e751c2eec666ed702c898bb05c67708a74fc08ef82ce04f973fd905e4a7d5c618f1604389e650b56fc65.5ffd1ee9d5cb63db47761f9f9dba20da";
const passwords = ["admin123", "hr123", "manager123", "employee123", "asn123", "asn@123", "asn1234", "password", "Navnath@123", "Nav@123", "Navnath123", "admin", "123456", "sujay123", "password123"];

async function run() {
  for (const pw of passwords) {
    if (await comparePasswords(pw, commonHash)) {
      console.log(`FOUND! Password for common hash is: ${pw}`);
      return;
    }
  }
  console.log("No common password matched.");
}

run();
