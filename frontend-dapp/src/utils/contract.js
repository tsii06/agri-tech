import { ethers } from "ethers";
import ProducteurEnPhaseCulture from "../abi/ProducteurEnPhaseCulture.json";
import CollecteurExportateur from "../abi/CollecteurExportateur.json";
import CollecteurProducteur from "../abi/CollecteurProducteur.json";
import GestionnaireActeurs from "../abi/GestionnaireActeurs.json";
import ExportateurClient from "../abi/ExportateurClient.json";

// Adresses des contrats déployés sur le réseau local
// Ces adresses sont obtenues après le déploiement avec le script deploy.js
// const PRODUCTEUR_PROXY_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
// const CollecteurExportateur_PROXY_ADDRESS = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
// const CollecteurProducteur_PROXY_ADDRESS = "0x610178dA211FEF7D417bC0e6FeD39F05609AD788";
// const GESTIONNAIRE_ACTEURS_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
// const EXPORTATEUR_CLIENT_ADDRESS = "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82";
// const RPC_PROVIDER_CLIENT = "http://127.0.0.1:8545";



// // Adresses des contrats déployés sur le réseau amoy
// Ces adresses sont obtenues après le déploiement avec le script deploy.js
const PRODUCTEUR_PROXY_ADDRESS = "0x9D56945eC5659Eb1DD1E2d92312Bd3E31225f8a2";
const CollecteurProducteur_PROXY_ADDRESS =
  "0x9f5B608263FC08906caC646007B6d59Fe4A5f8dF";
const GESTIONNAIRE_ACTEURS_ADDRESS =
  "0x0E1fEf3288bC967878e79FE3c88c0cfD4EE2c5Ff";
const CollecteurExportateur_PROXY_ADDRESS =
  "0x1CBF67931463D5f38fb5855140eA2b302C059243";
const EXPORTATEUR_CLIENT_ADDRESS = "0xdc0500D7013bA9e8aa20374cCc8894b9c391Ec09";
const RPC_PROVIDER_CLIENT = "https://rpc-amoy.polygon.technology";
const RPC_PROVIDER_WS = "wss://polygon-amoy-bor-rpc.publicnode.com";
// const RPC_PROVIDER_CLIENT = "https://polygon-amoy.g.alchemy.com/v2/elscICFcMfuGdm1jebr2e3dkOF4471eK";



export const URL_BLOCK_SCAN = "https://amoy.polygonscan.com/tx/";
// Constantes pour le debug - commencer à partir de 1 pour voir toutes les parcelles
// export const DEBUT_PARCELLE = 1;
// export const DEBUT_RECOLTE = 1;
// export const DEBUT_COMMANDE_RECOLTE = 1;
// export const DEBUT_PRODUIT = 1;
// export const DEBUT_COMMANDE_LOT_PRODUIT = 1;
// export const DEBUT_LOT_PRODUIT = 1;
// export const DEBUT_EXPEDITION = 1;

// Anciennes valeurs (remettre si nécessaire)
export const DEBUT_PARCELLE = 4;
export const DEBUT_RECOLTE = 7;
export const DEBUT_COMMANDE_RECOLTE = 16;
export const DEBUT_PRODUIT = 1;
export const DEBUT_COMMANDE_LOT_PRODUIT = 7;
export const DEBUT_LOT_PRODUIT = 5;
export const DEBUT_EXPEDITION = 5;

export const EXCLUDE_EXPEDITION = ["EXP-17570788211", "EXP-17575277782", "EXP-17576898483", "EXP-17577490264"];

export async function getProvider(read = false) {
  let accounts = [];
  if (window.ethereum) {
    accounts = await window.ethereum.request({ method: "eth_accounts" });
  }

  if (accounts && accounts.length > 0 && !read) {
    const providerActeur = new ethers.BrowserProvider(window.ethereum, "any");
    await providerActeur.ready;
    // await providerActeur.getBlockNumber();
    return providerActeur.getSigner();
  } else {
    const providerClient = new ethers.JsonRpcProvider(RPC_PROVIDER_CLIENT);
    return providerClient;
  }
}

export async function getProducteurContract() {
  try {
    const provider = await getProvider();
    // const signer = await provider.getSigner();
    return new ethers.Contract(
      PRODUCTEUR_PROXY_ADDRESS,
      ProducteurEnPhaseCulture.abi,
      // signer
      provider
    );
  } catch (error) {
    console.error(
      "Erreur lors de l'initialisation du contrat Producteur:",
      error
    );
    throw error;
  }
}

export async function getCollecteurExportateurContract() {
  try {
    const provider = await getProvider();
    // const signer = await provider.getSigner();
    return new ethers.Contract(
      CollecteurExportateur_PROXY_ADDRESS,
      CollecteurExportateur.abi,
      // signer
      provider
    );
  } catch (error) {
    console.error(
      "Erreur lors de l'initialisation du contrat Collecteur:",
      error
    );
    throw error;
  }
}

export async function getCollecteurProducteurContract(read = false) {
  try {
    const provider = await getProvider(read);
    // const signer = await provider.getSigner();
    return new ethers.Contract(
      CollecteurProducteur_PROXY_ADDRESS,
      CollecteurProducteur.abi,
      // signer
      provider
    );
  } catch (error) {
    console.error(
      "Erreur lors de l'initialisation du contrat Collecteur:",
      error
    );
    throw error;
  }
}

// ExportateurClient
export async function getExportateurClientContract() {
  try {
    const provider = await getProvider();
    // const signer = await provider.getSigner();
    return new ethers.Contract(
      EXPORTATEUR_CLIENT_ADDRESS,
      ExportateurClient.abi,
      // signer
      provider
    );
  } catch (error) {
    console.error(
      "Erreur lors de l'initialisation du contrat ExportateurClient:",
      error
    );
    throw error;
  }
}

/**
 * Retourne une instance du contrat GestionnaireActeurs
 */
export async function getGestionnaireActeursContract() {
  try {
    const provider = await getProvider();
    // const signer = await provider.getSigner();
    return new ethers.Contract(
      GESTIONNAIRE_ACTEURS_ADDRESS,
      GestionnaireActeurs.abi,
      // signer
      provider
    );
  } catch (error) {
    console.error(
      "Erreur lors de l'initialisation du contrat GestionnaireActeurs:",
      error
    );
    return false;
  }
}

// Pour la compatibilité avec le code existant
export async function getContract() {
  return getProducteurContract();
}

// il faut preciser quelle contrat utiliser
export async function executeContractMethod(contrat, method, ...args) {
  try {
    const provider = contrat.runner.provider;
    await provider.ready;

    const tx = await method.apply(contrat, args);

    return tx;
  } catch (error) {
    console.error("Erreur lors de l'exécution de la méthode:", error);
    throw error;
  }
}

/**
 * Récupère le rôle d'une adresse via le contrat GestionnaireActeurs
 * @param {string} address Adresse Ethereum de l'utilisateur
 * @returns {Promise<number|null>} Le numéro du rôle ou null si non trouvé
 */
export async function getRoleOfAddress(address) {
  try {
    const contract = await getGestionnaireActeursContract();
    const details = await contract.getDetailsActeur(address);
    if (details && details[0]) {
      return Number(details[1]);
    }
    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération du rôle:", error);
    return null;
  }
}
