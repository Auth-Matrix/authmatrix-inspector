import {
  ADAPTER_PROTOCOL,
  EVIDENCE_FORMAT,
  EVIDENCE_FORMAT_VERSION,
  VECTOR_FORMAT,
  VECTOR_FORMAT_VERSION,
  type EvidenceFile,
  type VectorFile,
} from "@anasabubakar/authmatrix-core";
import compat from "../compat.json";
import pairing from "../vendor/pairing.json";

export interface CompatReport {
  ok: boolean;
  problems: string[];
  core: { package: string; version: string; coreCommit: string; sha256: string };
  vectorFormatVersion: string;
}

const major = (v: string) => v.split(".")[0];

/** Runtime compat check of the data the app is about to display against what this build was tested with. */
export function checkCompat(vectors: VectorFile, evidence: EvidenceFile[]): CompatReport {
  const problems: string[] = [];
  const pair = compat.pairs.find((p) => p.core === pairing.package);
  if (!pair) problems.push(`compat.json has no entry for ${pairing.package}`);
  if (vectors.format !== VECTOR_FORMAT) problems.push(`vector file format is "${vectors.format}", expected "${VECTOR_FORMAT}"`);
  if (major(vectors.formatVersion) !== major(VECTOR_FORMAT_VERSION)) problems.push(`vector formatVersion ${vectors.formatVersion} has a different major than the core library (${VECTOR_FORMAT_VERSION})`);
  if (pair && String(pair.vectorFormatMajor) !== major(vectors.formatVersion)) problems.push(`vector formatVersion ${vectors.formatVersion} was not tested with this inspector (expects major ${pair.vectorFormatMajor})`);
  if (vectors.formatVersion !== pairing.vectorFormatVersion) problems.push(`vector formatVersion ${vectors.formatVersion} differs from the stamped ${pairing.vectorFormatVersion}`);
  for (const e of evidence) {
    if (e.format !== EVIDENCE_FORMAT) problems.push(`evidence format "${e.format}" is not ${EVIDENCE_FORMAT}`);
    if (major(e.formatVersion) !== major(EVIDENCE_FORMAT_VERSION)) problems.push(`evidence ${e.kind} formatVersion ${e.formatVersion} has a different major than the core library`);
  }
  if (ADAPTER_PROTOCOL !== compat.pairs[0]?.adapterProtocol) problems.push("adapter protocol identifier differs from compat.json");
  return { ok: problems.length === 0, problems, core: { package: pairing.package, version: pairing.version, coreCommit: pairing.coreCommit, sha256: pairing.sha256 }, vectorFormatVersion: vectors.formatVersion };
}
