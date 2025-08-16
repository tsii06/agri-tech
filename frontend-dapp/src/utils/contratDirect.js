import { ethers } from "ethers";
import ABI from "../abi/CollecteurExportateur.json";

// === CONFIG ===
// En dev local :
const RPC_URL = "http://127.0.0.1:8545";
// ⚠️ IMPORTANT: Mettez à jour cette adresse avec l'adresse du proxy CollecteurExportateur déployé
const CONTRACT_ADDRESS = "0x71089Ba41e478702e1904692385Be3972B2cBf9e"; // À remplacer par l'adresse du proxy
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

// Fonction de test pour diagnostiquer le problème
export async function testContract() {
  try {
    const provider = getProvider();
    const code = await provider.getCode(CONTRACT_ADDRESS);
    console.log("Code du contrat:", code);
    
    if (code === "0x") {
      console.error("Aucun contrat à cette adresse");
      return false;
    }
    
    const contract = getReadContract();
    
    // Test des fonctions disponibles
    try {
      const compteur = await contract.getCompteurProduit();
      console.log("Compteur produit:", compteur.toString());
    } catch (e) {
      console.error("Erreur getCompteurProduit:", e.message);
    }
    
    try {
      const produit = await contract.getProduit(1);
      console.log("Produit 1:", produit);
    } catch (e) {
      console.error("Erreur getProduit:", e.message);
    }
    
    return true;
  } catch (error) {
    console.error("Erreur de test:", error);
    return false;
  }
}
