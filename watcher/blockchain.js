import { ethers } from "ethers";
import config from "./config.js";
import { createAncrage } from "./services/ancrage.service.js";

// Les abi des contrats
import exportateurClientABI from "./abi/ExportateurClient.json" with { type: 'json' };
import registreExpeditionABI from "./abi/RegistreExpedition.json" with { type: 'json' };
import { privateProvider } from "./utils/onChain/watcherProvidersUtils.js";

// Providers
const publicProvider = new ethers.JsonRpcProvider(config.publicRPC);

// Signer pour envoi tx sur public
const signer = new ethers.Wallet(config.privateKey, publicProvider);

const exportateurClientContrat = new ethers.Contract(
  config.adresseExportateurClientContrat,
  exportateurClientABI.abi,
  privateProvider
);
const registreExpeditionContrat = new ethers.Contract(
  config.adresseRegistreExpeditionContrat,
  registreExpeditionABI.abi,
  signer
);

// module.exports
export const listenExpedition = async (callback) => {
  exportateurClientContrat.on(
    "AjouterExpedition",
    (exportateurAddr, idArticle, quantite, prix, rootMerkle, ref, event) => {
      console.log(`\nNouvelle expedition: ${idArticle}`);
      callback({ ref, rootMerkle });
    }
  );
};

export const pushToPublic = async (data) => {
  try {
    const tx = await registreExpeditionContrat.ancrerLot(
      data.ref,
      data.rootMerkle
    );
    await tx.wait();
    console.log("Expedition envoyée sur Amoy");
    // Enregistrer le hash dans la db.
    await createAncrage(tx.hash, data.ref);
    console.log("Enregistrement dans db confirmer.");
  } catch (error) {
    console.log(
      "Erreur lors de l'envoye de la transaction vers blockchain public : ",
      error
    );
  }
};

export { registreExpeditionContrat };
