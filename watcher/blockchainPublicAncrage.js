import { ethers } from "ethers";
import config from "./config.js";
import { createAncrage } from "./services/ancrage.service.js";

// Les abi des contrats
import exportateurClientABI from "./abi/ExportateurClient.json" with { type: 'json' };
import registreExpeditionABI from "./abi/RegistreExpedition.json" with { type: 'json' };
import { createRpcProvider, ReconnectingWebSocketProvider, SmartContractManager } from "./utils/onChain/watcherSetupOnChain.js";

// Providers
const publicProvider = createRpcProvider(config.publicRPC);

// Signer pour envoi tx sur public
const signer = new ethers.Wallet(config.privateKey, publicProvider);

const registreExpeditionContrat = new SmartContractManager(
  config.adresseRegistreExpeditionContrat,
  registreExpeditionABI.abi,
  signer
);

export const handleAjouterExpedition = (exportateurAddr, idArticle, quantite, prix, rootMerkle, ref, event) => {
  console.log(`\nNouvelle expedition: ${idArticle}`);
  pushToPublic({ ref, rootMerkle });
};

// Ecouteur pour l'event d'ajout d'expedition
export const listenExpedition = async () => {
  const privateWsProvider = new ReconnectingWebSocketProvider(config.privateWs);
  const exportateurClientContrat = new SmartContractManager(
    config.adresseExportateurClientContrat,
    exportateurClientABI.abi,
    privateWsProvider
  );

  // Ecouter l'event AjouterExpedition.
  await exportateurClientContrat.contract.on("AjouterExpedition", handleAjouterExpedition);
  console.log("Nbr de handler attacher a l'event AjouterExpedition : ", await exportateurClientContrat.contract.listenerCount());

  // Nouvelle wsProvide et nouvel contrat si wsProvider tombe.
  privateWsProvider.getProvider().websocket.on("close", async () => {
    privateWsProvider.destroy();
    // Supprimer les ecouteurs de exportateur contrat
    await exportateurClientContrat.contract.off("AjouterExpedition", handleAjouterExpedition);
    await listenExpedition();
  });

  // Fermeture propre quand c'est fini
  process.on('SIGINT', () => {
    privateWsProvider.destroy();
    process.exit();
  });
};

const pushToPublic = async (data) => {
  try {
    console.log("Processing expedition for public chain...");
    const tx = await registreExpeditionContrat.write(
      'ancrerLot',
      [
        data.ref,
        data.rootMerkle
      ]
    );
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
