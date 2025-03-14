import { ethers } from "ethers";
import ProducteurEnPhaseCultureJson from "../abi/ProducteurEnPhaseCulture.json";
import CollecteurExportateurContratJson from "../abi/CollecteurExportateurContrat.json";

// Adresses des contrats déployés sur le réseau local
// Ces adresses sont obtenues après le déploiement avec le script deploy.js
const PRODUCTEUR_PROXY_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";  // ProducteurProxy
const COLLECTEUR_PROXY_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";  // CollecteurProxy

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
      ProducteurEnPhaseCultureJson.abi,
      signer
    );
  } catch (error) {
    console.error("Erreur lors de l'initialisation du contrat Producteur:", error);
    throw error;
  }
}

export async function getCollecteurContract() {
  try {
    const provider = await getProvider();
    const signer = await provider.getSigner();
    return new ethers.Contract(
      COLLECTEUR_PROXY_ADDRESS,
      CollecteurExportateurContratJson.abi,
      signer
    );
  } catch (error) {
    console.error("Erreur lors de l'initialisation du contrat Collecteur:", error);
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
