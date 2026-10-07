// jsdom gives tests a different Uint8Array realm than Node's TextEncoder returns, and the SDK's XDR
// codec checks `instanceof Uint8Array`. Real browsers have a single realm, so this only matters in tests.
const NodeTextEncoder = globalThis.TextEncoder;
class RealmSafeTextEncoder extends NodeTextEncoder {
  override encode(input?: string): Uint8Array<ArrayBuffer> {
    return new Uint8Array(super.encode(input));
  }
}
globalThis.TextEncoder = RealmSafeTextEncoder as typeof globalThis.TextEncoder;
