// Fails the build if the vendored core tarball, its stamp, compat.json and the installed copy disagree.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const fail = (m) => {
  console.error(`pairing check failed: ${m}`);
  process.exit(1);
};
const pairing = JSON.parse(readFileSync("vendor/pairing.json", "utf8"));
const compat = JSON.parse(readFileSync("compat.json", "utf8"));
const tgzPath = `vendor/${pairing.artifact}`;
if (!existsSync(tgzPath)) fail(`${tgzPath} is missing`);
const sha = createHash("sha256").update(readFileSync(tgzPath)).digest("hex");
if (sha !== pairing.sha256) fail(`tarball sha256 ${sha} differs from vendor/pairing.json (${pairing.sha256}); run pnpm stamp`);
const pair = compat.pairs.find((p) => p.core === pairing.package);
if (!pair) fail(`compat.json has no pair for ${pairing.package}`);
if (pair.version !== pairing.version) fail(`compat.json expects core ${pair.version} but the stamp is ${pairing.version}`);
if (String(pair.vectorFormatMajor) !== pairing.vectorFormatVersion.split(".")[0]) fail("vector format major differs from compat.json");
if (pair.vectorFormat !== pairing.vectorFormat) fail("vector format name differs from compat.json");
const installed = JSON.parse(readFileSync(`node_modules/${pairing.package}/package.json`, "utf8"));
if (installed.version !== pairing.version) fail(`installed core ${installed.version} differs from stamp ${pairing.version}; run pnpm install`);
const vec = JSON.parse(readFileSync(`node_modules/${pairing.package}/vectors/authmatrix-vectors.v1.json`, "utf8"));
if (vec.formatVersion !== pairing.vectorFormatVersion) fail("installed vectors formatVersion differs from the stamp");
console.log(`pairing ok: ${pairing.package}@${pairing.version} sha256 ${sha.slice(0, 12)} core commit ${pairing.coreCommit.slice(0, 8)}`);
