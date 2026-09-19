import { createPublicKey, verify } from "node:crypto";
import { verifyMessage } from "viem";

// Wallet sign-in: the server issues a one-time message, the wallet signs it
// (no transaction, no fee), the server verifies the signature. Structured
// like SIWE (EIP-4361) but chain-agnostic so Solana works the same way.

export type Chain = "evm" | "sol";

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

function b58decode(s: string): Buffer | null {
  if (!s || s.length > 64) return null;
  let n = 0n;
  for (const ch of s) {
    const i = B58.indexOf(ch);
    if (i < 0) return null;
    n = n * 58n + BigInt(i);
  }
  let hex = n.toString(16);
  if (hex.length % 2) hex = "0" + hex;
  const body = n === 0n ? Buffer.alloc(0) : Buffer.from(hex, "hex");
  let zeros = 0;
  while (zeros < s.length && s[zeros] === "1") zeros++;
  return Buffer.concat([Buffer.alloc(zeros), body]);
}

export function isChain(c: unknown): c is Chain {
  return c === "evm" || c === "sol";
}

// Returns the canonical form used as the account key, or null if malformed.
export function normalizeAddress(chain: Chain, address: unknown): string | null {
  if (typeof address !== "string") return null;
  if (chain === "evm") return /^0x[0-9a-fA-F]{40}$/.test(address) ? address.toLowerCase() : null;
  const raw = b58decode(address);
  return raw && raw.length === 32 ? address : null;
}

export const accountKey = (chain: Chain, address: string) => `${chain}:${address}`;

export function shortAddress(key: string): string {
  const addr = key.slice(key.indexOf(":") + 1);
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function buildMessage(p: { chain: Chain; address: string; origin: string; nonce: string; issuedAt: Date; expiresAt: Date }): string {
  const net = p.chain === "evm" ? "Ethereum" : "Solana";
  return [
    `${new URL(p.origin).host} wants you to sign in with your ${net} account:`,
    p.address,
    "",
    "Sign in to SYNNOD to claim a node and speak to the mind. This is a signature only: no transaction, no fee.",
    "",
    `URI: ${p.origin}`,
    `Nonce: ${p.nonce}`,
    `Issued At: ${p.issuedAt.toISOString()}`,
    `Expiration Time: ${p.expiresAt.toISOString()}`,
  ].join("\n");
}

export async function verifySignature(chain: Chain, address: string, message: string, signature: string): Promise<boolean> {
  try {
    if (chain === "evm") {
      if (!/^0x[0-9a-fA-F]+$/.test(signature)) return false;
      return await verifyMessage({ address: address as `0x${string}`, message, signature: signature as `0x${string}` });
    }
    const pub = b58decode(address);
    const sig = Buffer.from(signature, "base64");
    if (!pub || pub.length !== 32 || sig.length !== 64) return false;
    const key = createPublicKey({ key: Buffer.concat([ED25519_SPKI_PREFIX, pub]), format: "der", type: "spki" });
    return verify(null, Buffer.from(message, "utf8"), key, sig);
  } catch {
    return false;
  }
}
