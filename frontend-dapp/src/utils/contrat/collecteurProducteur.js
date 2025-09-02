import { getCollecteurProducteurContract } from "../contract";
import { getFileFromPinata } from "../ipfsUtils";

const contrat = await getCollecteurProducteurContract();

/**
 * 
 * @param {number} _idCommande 
 * @returns 
 */
export const getCommandeRecolte = async (_idCommande) => {
  try {
    const res = await contrat.getCommande(_idCommande);
    return {
      id: Number(res.id),
      idRecolte: Number(res.idRecolte),
      quantite: Number(res.quantite),
      prix: Number(res.prix),
      statutTransport: Number(res.statutTransport),
      statutProduit: Number(res.statutProduit),
      payer: res.payer,
      producteur: res.producteur.toString(),
      collecteur: res.collecteur.toString(),
      enregistrerCondition: res.enregistrerCondition,
      transporteur: res.transporteur.toString(),
    };
  } catch (error) {
    console.log("Recuperation commande lot produit : ", error);
  }
};

/**
 * 
 * @param {number} _idCommande 
 * @returns 
 */
export const getConditionTransportPC = async (_idCommande) => {
  let conditionComplet = {};
  // recuperer conditions transport on-chain
  try {
    const conditionOnChain = await contrat.getConditionTransport(_idCommande);
    conditionComplet = {
      id: conditionOnChain.id,
      cid: conditionOnChain.cid,
      hashMerkle: conditionOnChain.hashMerkle,
    };
  } catch (error) {
    console.error("Erreur recuperation condition transport CE : ", error);
    return;
  }
  // recuperer conditions transport ipfs
  const conditionIpfs = await getFileFromPinata(conditionComplet.cid);
  conditionComplet = {
    ...conditionComplet,
    ...conditionIpfs.data.items
  };
  return conditionComplet;
};

/**
 * 
 * @param {number} _idRecolte 
 * @returns {object}
 */
export const getRecolte = async (_idRecolte) => {
  let recolteComplet = {};

  // recuperer info on-chain
  try {
    const recolteOnChain = await contrat.getRecolte(_idRecolte);
    // convertir array
    const idParcelles = Object.values(recolteOnChain.idParcelle);
    recolteComplet = {
      id: Number(recolteOnChain.id),
      quantite: Number(recolteOnChain.quantite),
      prixUnit: Number(recolteOnChain.prixUnit),
      idParcelle: idParcelles.map(id => Number(id)),
      certifie: recolteOnChain.ceritifie,
      certificatPhytosanitaire: recolteOnChain.certificatPhytosanitaire.toString(),
      producteur: recolteOnChain.producteur.toString(),
      hashMerkle: recolteOnChain.hashMerkle.toString(),
      cid: recolteOnChain.cid.toString(),
    }
  } catch (error) {
    console.error("Recuperation recolte : ", error);
  }

  // recuperation info off-chain
  const recolteIpfs = await getFileFromPinata(recolteComplet.cid);
  return {
    ...recolteComplet,
    ...recolteIpfs.data.items
  };
};