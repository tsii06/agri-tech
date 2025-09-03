import { ethers } from "ethers";
import ProducteurEnPhaseCulture from "../abi/ProducteurEnPhaseCulture.json";
import CollecteurExportateur from "../abi/CollecteurExportateur.json";
import CollecteurProducteur from "../abi/CollecteurProducteur.json";
import GestionnaireActeurs from "../abi/GestionnaireActeurs.json";
import ExportateurClient from "../abi/ExportateurClient.json";

// Adresses des contrats déployés sur le réseau local
// Ces adresses sont obtenues après le déploiement avec le script deploy.js
const PRODUCTEUR_PROXY_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"; // ProducteurProxy
const CollecteurExportateur_PROXY_ADDRESS =
  "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"; // CollecteurProxy
const CollecteurProducteur_PROXY_ADDRESS =
  "0x610178dA211FEF7D417bC0e6FeD39F05609AD788";
// Adresse du contrat GestionnaireActeurs déployé sur le réseau local
const GESTIONNAIRE_ACTEURS_ADDRESS =
  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // À remplacer par la vraie adresse après déploiement
const EXPORTATEUR_CLIENT_ADDRESS = "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82"; // À remplacer par la vraie adresse après déploiement

const RPC_PROVIDER_CLIENT = "http://127.0.0.1:8545";

export async function getProvider() {
  if (!window.ethereum) {
    throw new Error("MetaMask n'est pas installé");
  }
  
  // const accounts = await providerActeur.listAccounts();
  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  
  if (accounts && accounts.length > 0) {
    const providerActeur = new ethers.BrowserProvider(window.ethereum, "any");
    await providerActeur.ready;
    await providerActeur.getBlockNumber();
    return providerActeur;
  } else {
    const providerClient = new ethers.JsonRpcProvider(RPC_PROVIDER_CLIENT);
    return providerClient;
  }
}

export async function getProducteurContract() {
  try {
    const provider = await getProvider();
    const signer = await provider.getSigner();
    return new ethers.Contract(
      PRODUCTEUR_PROXY_ADDRESS,
      ProducteurEnPhaseCulture.abi,
      signer
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
    const signer = await provider.getSigner();
    return new ethers.Contract(
      CollecteurExportateur_PROXY_ADDRESS,
      CollecteurExportateur.abi,
      signer
    );
  } catch (error) {
    console.error(
      "Erreur lors de l'initialisation du contrat Collecteur:",
      error
    );
    throw error;
  }
}

export async function getCollecteurProducteurContract() {
  try {
    const provider = await getProvider();
    const signer = await provider.getSigner();
    return new ethers.Contract(
      CollecteurProducteur_PROXY_ADDRESS,
      CollecteurProducteur.abi,
      signer
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
    const signer = await provider.getSigner();
    return new ethers.Contract(
      EXPORTATEUR_CLIENT_ADDRESS,
      ExportateurClient.abi,
      signer
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
    const signer = await provider.getSigner();
    return new ethers.Contract(
      GESTIONNAIRE_ACTEURS_ADDRESS,
      GestionnaireActeurs.abi,
      signer
    );
  } catch (error) {
    console.error(
      "Erreur lors de l'initialisation du contrat GestionnaireActeurs:",
      error
    );
    throw error;
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
