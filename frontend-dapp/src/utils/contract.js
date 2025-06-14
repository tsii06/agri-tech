import { ethers } from "ethers";
import ProducteurEnPhaseCulture from "../abi/ProducteurEnPhaseCulture.json";
import CollecteurExportateur from "../abi/CollecteurExportateur.json";
import CollecteurProducteur from "../abi/CollecteurProducteur.json";
import GestionnaireActeurs from "../abi/GestionnaireActeurs.json";

// Adresses des contrats déployés sur le réseau local
// Ces adresses sont obtenues après le déploiement avec le script deploy.js
const PRODUCTEUR_PROXY_ADDRESS = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318";  // ProducteurProxy
const CollecteurExportateur_PROXY_ADDRESS = "0x610178dA211FEF7D417bC0e6FeD39F05609AD788";  // CollecteurProxy
const CollecteurProducteur_PROXY_ADDRESS = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e"; 
// Adresse du contrat GestionnaireActeurs déployé sur le réseau local
const GESTIONNAIRE_ACTEURS_ADDRESS = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"; // À remplacer par la vraie adresse après déploiement

export async function getProvider() {
  if (!window.ethereum) {
    throw new Error("MetaMask n'est pas installé");
  }

  const provider = new ethers.BrowserProvider(window.ethereum, "any");
  await provider.ready;
  await provider.getBlockNumber();
  return provider;
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
    console.error("Erreur lors de l'initialisation du contrat Producteur:", error);
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
    console.error("Erreur lors de l'initialisation du contrat Collecteur:", error);
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
    console.error("Erreur lors de l'initialisation du contrat Collecteur:", error);
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
    console.error("Erreur lors de l'initialisation du contrat GestionnaireActeurs:", error);
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
