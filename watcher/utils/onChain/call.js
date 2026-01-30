import { registreExpeditionContrat } from "../../blockchain.js";

export const getExpeditionOnMainnet = async (_ref) => {
  try {
    const res = await registreExpeditionContrat.getExpeditionAncrer(_ref);
    // Transformer la reponse en objet js normal
    const cleanRes = res.toObject();
    // Convertit les BigInt en String
    return JSON.parse(
      JSON.stringify(cleanRes, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );
    return cleanRes;
  } catch (error) {
    console.error("Erreur lors de l'appel au smart contract public : ", error);
    throw new Error(
      "Erreur lors de l'appel de la fonction getExpeditionAncrer du smart contract public."
    );
  }
};
