import { getProducteurContract } from "../contract";
import { getFileFromPinata } from "../ipfsUtils";

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
    parcelleComplet = {
      id: Number(parcelleOnChain.id),
      cid: parcelleOnChain.cid.toString(),
      producteur: parcelleOnChain.producteur.toString(),
      hashMerkle: parcelleOnChain.hashMerkle.toString(),
    };
  } catch (error) {
    console.error("Recuperation parcelle : ", error);
  }

  // recuperation data off-chain
  const parcelleIpfs = await getFileFromPinata(parcelleComplet.cid);

  return {
    ...parcelleComplet,
    ...parcelleIpfs.data.items
  }
};
