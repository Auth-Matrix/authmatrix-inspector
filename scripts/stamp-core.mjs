// Records which core artifact the inspector was built and tested against.
// Usage: node scripts/stamp-core.mjs --core-commit <git sha of authmatrix-core>
//   (run after replacing vendor/*.tgz with a fresh `pnpm pack` of authmatrix-core)
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const i = process.argv.indexOf("--core-commit");
const coreCommit = i > -1 ? process.argv[i + 1] : undefined;
if (!coreCommit || !/^[0-9a-f]{40}$/.test(coreCommit)) throw new Error("pass --core-commit <40-hex git sha of the core repo the tarball was packed from>");
const tgz = readdirSync("vendor").find((f) => f.endsWith(".tgz"));
if (!tgz) throw new Error("no core tarball in vendor/");
const read = (p) => execFileSync("tar", ["-xzOf", `vendor/${tgz}`, `package/${p}`], { encoding: "utf8" });
const pkg = JSON.parse(read("package.json"));
const vectors = JSON.parse(read("vectors/authmatrix-vectors.v1.json"));
const evidence = JSON.parse(read("evidence/testnet/summary.json"));
const stamp = {
  package: pkg.name,
  version: pkg.version,
  artifact: tgz,
  sha256: createHash("sha256").update(readFileSync(`vendor/${tgz}`)).digest("hex"),
  coreCommit,
  vectorFormat: vectors.format,
  vectorFormatVersion: vectors.formatVersion,
  evidenceFormatVersion: evidence.formatVersion,
  stellarSdk: pkg.dependencies["@stellar/stellar-sdk"],
};
writeFileSync("vendor/pairing.json", JSON.stringify(stamp, null, 2) + "\n");
console.log(`stamped ${pkg.name}@${pkg.version} (${stamp.sha256.slice(0, 12)}) from core ${coreCommit.slice(0, 8)}`);
