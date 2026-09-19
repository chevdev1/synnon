// Chain + token configuration shared by client and server. Everything that
// changes when the real launchpad token arrives lives in env vars, so the
// swap is: set NEXT_PUBLIC_SYNOD_TOKEN_ADDRESS (and maybe the chain), redeploy.

export interface ChainConfig {
  id: number;
  name: string;
  rpc: string;
  explorer: string;
  currency: { name: string; symbol: string; decimals: number };
  faucet?: string;
}

// Robinhood Chain: an Arbitrum L2 on Ethereum, ETH as gas.
// Source: https://docs.robinhood.com/chain/connecting
const CHAINS: Record<string, ChainConfig> = {
  testnet: {
    id: 46630,
    name: "Robinhood Chain Testnet",
    rpc: "https://rpc.testnet.chain.robinhood.com",
    explorer: "https://explorer.testnet.chain.robinhood.com",
    currency: { name: "Ether", symbol: "ETH", decimals: 18 },
    faucet: "https://faucet.testnet.chain.robinhood.com",
  },
  mainnet: {
    id: 4663,
    name: "Robinhood Chain",
    rpc: "https://rpc.mainnet.chain.robinhood.com",
    explorer: "https://robinhoodchain.blockscout.com",
    currency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
};

const which = process.env.NEXT_PUBLIC_SYNOD_CHAIN === "mainnet" ? "mainnet" : "testnet";

export const CHAIN: ChainConfig = {
  ...CHAINS[which],
  // Escape hatch for local testing against a dev node.
  rpc: process.env.SYNOD_RPC_URL ?? CHAINS[which].rpc,
};

const addr = process.env.NEXT_PUBLIC_SYNOD_TOKEN_ADDRESS ?? "";

export const TOKEN = {
  // Empty address = gating off: claiming stays free.
  address: /^0x[0-9a-fA-F]{40}$/.test(addr) ? (addr.toLowerCase() as `0x${string}`) : null,
  symbol: process.env.NEXT_PUBLIC_SYNOD_TOKEN_SYMBOL ?? "tSYNOD",
  decimals: Number(process.env.NEXT_PUBLIC_SYNOD_TOKEN_DECIMALS ?? 18),
  // Whole tokens a wallet must hold to claim a node.
  minHold: Number(process.env.NEXT_PUBLIC_SYNOD_MIN_HOLD ?? 100),
  // The test token has a public faucet(); a real launchpad token does not.
  faucet: process.env.NEXT_PUBLIC_SYNOD_TOKEN_FAUCET === "1",
};

export const gatingEnabled = TOKEN.address !== null;

export const explorerAddress = (a: string) => `${CHAIN.explorer}/address/${a}`;
export const explorerTx = (h: string) => `${CHAIN.explorer}/tx/${h}`;
