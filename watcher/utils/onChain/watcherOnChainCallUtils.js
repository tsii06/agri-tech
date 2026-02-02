import { registreExpeditionContrat } from "../../blockchainPublicAncrage.js";

export const getExpeditionOnMainnet = async (_ref) => {
  try {
    const res = await registreExpeditionContrat.read('getExpeditionAncrer', _ref);
    return JSON.parse(res);
  } catch (error) {
    console.error("Erreur lors de l'appel au smart contract public : ", error);
    throw new Error(
      "Erreur lors de l'appel de la fonction getExpeditionAncrer du smart contract public."
    );
  }
};
