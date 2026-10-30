import { scrypt } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64));
  return hashedBuf.equals(suppliedBuf);
}

const nkHash = "8357e5428c1d15223522c93f1f788c15801f710cebffda941c3de26d4e6d0a70c43c12ce97bdb15bd234aa26657b5ec3a28112f50e590a3921b02966e8e4d166.a934fb5363506fe8256d40e701e4d556";
const passwords = ["admin123", "hr123", "manager123", "employee123", "asn123", "asn@123", "asn1234", "password", "Navnath@123", "Nav@123", "Navnath123", "admin", "123456"];

async function run() {
  for (const pw of passwords) {
    if (await comparePasswords(pw, nkHash)) {
      console.log(`FOUND! Password for nk@asn.com is: ${pw}`);
      return;
    }
  }
  console.log("No common password matched.");
}

run();
