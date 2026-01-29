const { ethers } = require("ethers");
const config = require("./config");

// Les abi des contrats
const exportateurClientABI = require("./abi/ExportateurClient.json");
const registreExpeditionABI = require("./abi/RegistreExpedition.json");

// Providers
const privateProvider = new ethers.WebSocketProvider(config.privateRPC); // websocket pour le rpc du smart contrat privee.
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

module.exports = {
  listenExpedition: async (callback) => {
    exportateurClientContrat.on(
      "AjouterExpedition",
      (exportateurAddr, idArticle, quantite, prix, rootMerkle, ref, event) => {
        console.log(`Nouvelle expedition: ${idArticle}`);
        callback({ ref, rootMerkle });
      }
    );
  },

  pushToPublic: async (data) => {
    try {
      const tx = await registreExpeditionContrat.ancrerLot(
        data.ref,
        data.rootMerkle
      );
      await tx.wait();
      console.log("Expedition envoyée sur Amoy");
    } catch (error) {
        console.log("Erreur lors de l'envoye de la transaction vers blockchain public : ", error);
    }
  },

  getExpeditionData: async (ref) => {
    return await exportateurClientContrat.getExpeditionByReference(ref);
  },

  privateProvider: privateProvider,
};
