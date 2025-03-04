import { ethers } from "ethers";
import CollecteurExportateurContrat from "../abi/CollecteurExportateurContrat.json";

const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

export const getContract = async () => {
  try {
    if (!window.ethereum) throw new Error("Metamask non détecté");

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Log pour debug
    console.log("Contract initialization:", {
      address: contractAddress,
      signer: await signer.getAddress()
    });

    const contract = new ethers.Contract(
      contractAddress,
      CollecteurExportateurContrat.abi,
      signer
    );

    // Vérifier que le contrat est bien initialisé
    console.log("Contract methods:", {
      hasAjouterProduit: !!contract.ajouterProduit,
      hasGetActeur: !!contract.getActeur
    });

    return contract;
  } catch (error) {
    console.error("Erreur lors de l'initialisation du contrat:", error);
    throw error;
  }
};
