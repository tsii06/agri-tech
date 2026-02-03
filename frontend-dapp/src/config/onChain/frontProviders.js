import { ethers } from "ethers";
import { ReconnectingWebSocketProvider } from "../../utils/contrat/frontSetupOnChain";
import { config } from "../frontConfig";

// WebSocket provider pour la blockchain sur VPS
export const wsProvider = new ReconnectingWebSocketProvider(
  config.privateWsUrl
).getProvider();

// Signer pour la blockchain sur VPS
export async function getSignerWallet() {
  await window.ethereum.request({ method: "eth_accounts" });
  const providerActeur = new ethers.BrowserProvider(window.ethereum, "any");
  await providerActeur.send("eth_requestAccounts", []);
  return await providerActeur.getSigner();
}
