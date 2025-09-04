import { getProducteurContract } from "../contract";
import { getFileFromPinata } from "../ipfsUtils";
import { getActeur } from "./gestionnaireActeurs";

const contrat = await getProducteurContract();

/**
 * 
 * @param {number} _idParcelle 
 * @returns {object}
 */
export const getParcelle = async (_idParcelle) => {
  let parcelleComplet = {};
  // Recuperer info on-chain
  try {
    const parcelleOnChain = await contrat.getParcelle(_idParcelle);
    const producteurDetails = await getActeur(parcelleOnChain.producteur.toString());
    parcelleComplet = {
      id: Number(parcelleOnChain.id),
      cid: parcelleOnChain.cid.toString(),
      producteur: {...producteurDetails, adresse: parcelleOnChain.producteur.toString()},
      hashMerkle: parcelleOnChain.hashMerkle?.toString() || "",
    };
  } catch (error) {
    console.error("Recuperation parcelle : ", error);
    return {};
  }

  if (!parcelleComplet.cid || parcelleComplet.cid === "") {
    return { ...parcelleComplet };
  }
  // recuperation data off-chain
  const parcelleIpfs = await getFileFromPinata(parcelleComplet.cid);

  return {
    ...parcelleComplet,
    ...parcelleIpfs.data.items
  }
};
