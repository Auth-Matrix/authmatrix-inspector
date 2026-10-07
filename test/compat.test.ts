import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkCompat } from "../src/compat.ts";
import { loadBundle } from "../src/data.ts";

const b = loadBundle();

describe("core pairing and compat check", () => {
  it("passes for the paired data", () => {
    const r = checkCompat(b.vectors, [b.native, b.testnet]);
    expect(r.problems).toEqual([]);
    expect(r.ok).toBe(true);
  });
  it("fails for a vector file with a different major version", () => {
    const r = checkCompat({ ...b.vectors, formatVersion: "2.0.0" }, [b.native, b.testnet]);
    expect(r.ok).toBe(false);
    expect(r.problems.join(" ")).toMatch(/major/);
  });
  it("fails for a different format name", () => {
    expect(checkCompat({ ...b.vectors, format: "other" as never }, [b.native, b.testnet]).ok).toBe(false);
  });
  it("fails for an evidence file with a different major", () => {
    expect(checkCompat(b.vectors, [{ ...b.native, formatVersion: "9.0.0" }, b.testnet]).ok).toBe(false);
  });
  it("vendor/pairing.json matches the vendored tarball and compat.json", () => {
    const pairing = JSON.parse(readFileSync("vendor/pairing.json", "utf8"));
    const compat = JSON.parse(readFileSync("compat.json", "utf8"));
    expect(createHash("sha256").update(readFileSync(`vendor/${pairing.artifact}`)).digest("hex")).toBe(pairing.sha256);
    expect(compat.pairs[0].version).toBe(pairing.version);
    expect(String(compat.pairs[0].vectorFormatMajor)).toBe(pairing.vectorFormatVersion.split(".")[0]);
    expect(pairing.coreCommit).toMatch(/^[0-9a-f]{40}$/);
  });
});
