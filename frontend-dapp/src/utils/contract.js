import { ethers } from "ethers";
import ContractJson from "../abi/CollecteurExportateurContrat.json";

const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

export async function getContract() {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask n'est pas installé");
    }

    // Attendre que le provider soit prêt
    const provider = new ethers.BrowserProvider(window.ethereum, "any");
    await provider.ready;

    // Obtenir le dernier bloc pour s'assurer que nous sommes synchronisés
    await provider.getBlockNumber();

    const signer = await provider.getSigner();
    
    // Utiliser ContractJson.abi au lieu de contractABI
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ContractJson.abi, signer);

    return contract;
  } catch (error) {
    console.error("Erreur lors de l'initialisation du contrat:", error);
    throw error;
  }
}

export async function executeContractMethod(method, ...args) {
  try {
    const contract = await getContract();
    
    // Attendre que le provider soit synchronisé
    const provider = contract.runner.provider;
    await provider.ready;

    // Ajouter un délai de confirmation plus long
    const tx = await method.apply(contract, args);
    
    // if (tx.wait) {
    //   // Si c'est une transaction, attendre plus de confirmations
    //   await tx.wait(2); // Attendre 2 confirmations
    // }
    
    return tx;
  } catch (error) {
    console.error("Erreur lors de l'exécution de la méthode:", error);
    throw error;
  }
}
