// Deploys the tSYNOD test token to the configured Robinhood Chain network.
//
//   npm run contract:deploy
//
// Key: DEPLOYER_PRIVATE_KEY, or a throw-away key generated once into
// .data/deployer.key (gitignored). It needs a little testnet ETH for gas:
// https://faucet.testnet.chain.robinhood.com  (testnet only, worthless key).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createPublicClient, createWalletClient, defineChain, formatEther, http } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { CHAIN, explorerAddress, explorerTx } from "../src/lib/chain.ts";
import { synodTestAbi, synodTestBytecode } from "../src/lib/synodTestArtifact.ts";

const KEY_FILE = ".data/deployer.key";

async function main() {
  let key = process.env.DEPLOYER_PRIVATE_KEY;
  if (!key) {
    if (existsSync(KEY_FILE)) key = readFileSync(KEY_FILE, "utf8").trim();
    else {
      key = generatePrivateKey();
      mkdirSync(".data", { recursive: true });
      writeFileSync(KEY_FILE, key);
      console.log(`Generated a throw-away testnet deployer key -> ${KEY_FILE}`);
    }
  }
  const account = privateKeyToAccount(key);

  const chain = defineChain({
    id: CHAIN.id,
    name: CHAIN.name,
    nativeCurrency: CHAIN.currency,
    rpcUrls: { default: { http: [CHAIN.rpc] } },
  });
  const pub = createPublicClient({ chain, transport: http() });
  const wallet = createWalletClient({ account, chain, transport: http() });

  console.log(`Network:  ${CHAIN.name} (chain ${CHAIN.id})`);
  console.log(`Deployer: ${account.address}`);
  const balance = await pub.getBalance({ address: account.address });
  console.log(`Balance:  ${formatEther(balance)} ${CHAIN.currency.symbol}`);
  if (balance === 0n) {
    console.log(`\nNo gas yet. Send some test ETH to the deployer address above:\n  ${CHAIN.faucet ?? "(no faucet for this network)"}\nthen run this command again.`);
    process.exitCode = 2; // (not process.exit(): it trips a libuv assertion on Windows)
    return;
  }

  const hash = await wallet.deployContract({ abi: synodTestAbi, bytecode: synodTestBytecode });
  console.log(`\nDeploy tx: ${explorerTx(hash)}`);
  const receipt = await pub.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success" || !receipt.contractAddress) {
    console.error("Deployment failed:", receipt.status);
    process.exitCode = 1;
    return;
  }
  console.log(`\nDeployed tSYNOD at ${receipt.contractAddress}`);
  console.log(`Explorer:  ${explorerAddress(receipt.contractAddress)}\n`);
  console.log("Set these env vars (locally in .env.local, and on Vercel), then redeploy:");
  console.log(`  NEXT_PUBLIC_SYNOD_TOKEN_ADDRESS=${receipt.contractAddress}`);
  console.log("  NEXT_PUBLIC_SYNOD_TOKEN_SYMBOL=tSYNOD");
  console.log("  NEXT_PUBLIC_SYNOD_MIN_HOLD=100");
  console.log("  NEXT_PUBLIC_SYNOD_TOKEN_FAUCET=1");
}

await main();
