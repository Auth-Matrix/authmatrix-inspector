// Data shipped inside the paired core tarball. Everything the app shows as "recorded" comes from here.
import { evidenceFileSchema, vectorFileSchema, type EvidenceFile, type VectorFile } from "@anasabubakar/authmatrix-core";
import vectorsRaw from "@anasabubakar/authmatrix-core/vectors/authmatrix-vectors.v1.json";
import nativeRaw from "@anasabubakar/authmatrix-core/evidence/native-host/results.json";
import testnetRaw from "@anasabubakar/authmatrix-core/evidence/testnet/summary.json";

export interface Bundle {
  vectors: VectorFile;
  native: EvidenceFile;
  testnet: EvidenceFile;
}

/** Parse (and so validate) the paired data. Throws a ZodError if the core data is not the expected shape. */
export function loadBundle(): Bundle {
  return {
    vectors: vectorFileSchema.parse(vectorsRaw),
    native: evidenceFileSchema.parse(nativeRaw),
    testnet: evidenceFileSchema.parse(testnetRaw),
  };
}
