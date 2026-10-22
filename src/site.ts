import pkg from "../package.json";

export const SITE = {
  name: "AuthMatrix",
  value: "Read Soroban authorization entries the same way in every SDK.",
  url: "https://authmatrix-inspector-anasamasama.vercel.app",
  version: pkg.version,
  date: "22 October 2026",
  coreRepo: "https://github.com/Auth-Matrix/authmatrix-core",
  appRepo: "https://github.com/Auth-Matrix/authmatrix-inspector",
  coreDocs: "https://stellar-developer-tools.gitbook.io/authmatrix-core/",
  appDocs: "https://stellar-developer-tools.gitbook.io/authmatrix-inspector/",
  npm: "https://www.npmjs.com/package/@anas.abubakar/authmatrix-core",
  discussions: "https://github.com/Auth-Matrix/authmatrix-inspector/discussions",
  issues: "https://github.com/Auth-Matrix/authmatrix-inspector/issues",
  goodFirst: "https://github.com/Auth-Matrix/authmatrix-inspector/labels/good%20first%20issue",
  contributing: "https://github.com/Auth-Matrix/authmatrix-inspector/blob/main/CONTRIBUTING.md",
  security: "https://github.com/Auth-Matrix/authmatrix-inspector/blob/main/SECURITY.md",
  license: "https://github.com/Auth-Matrix/authmatrix-inspector/blob/main/LICENSE",
  changelog: "https://github.com/Auth-Matrix/authmatrix-inspector/blob/main/CHANGELOG.md",
  releases: "https://github.com/Auth-Matrix/authmatrix-inspector/releases",
} as const;
