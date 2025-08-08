import { ethers } from "ethers";
import ABI from "../abi/CollecteurExportateur.json";

// === CONFIG ===
// En dev local :
const RPC_URL = "http://127.0.0.1:8545";
const CONTRACT_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
// ⚠️ Ne jamais commit en prod !
const PRIVATE_KEY =  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export function getProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

export function getReadContract() {
  const provider = getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, ABI.abi, provider);
}

export function getWriteContract() {
  if (!PRIVATE_KEY) {
    throw new Error("VITE_PRIVATE_KEY manquante. Définis-la pour les écritures.");
  }
  const provider = getProvider();
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  return new ethers.Contract(CONTRACT_ADDRESS, ABI.abi, wallet);
}

export async function getChainInfo() {
  const provider = getProvider();
  const net = await provider.getNetwork();
  const code = await provider.getCode(CONTRACT_ADDRESS);
  return { chainId: net.chainId.toString(), hasCode: code !== "0x" };
}
