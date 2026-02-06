import { ethers } from "ethers";
import { getCollecteurExportateurContract } from "./contract";
import { getActeur } from "./contrat/gestionnaireActeurs";
import { getFileFromPinata } from "./ipfsUtils";
import { hasRole } from "./roles";

/**
 *
 * @param {number} _id id du lot produit
 * @param {Array} roles a passer si l'user est un collecteur
 * @param {string} account a passer si l'user est un collecteur
 * @returns un lotproduit enrichi
 */
export const getLotProduitEnrichi = async (_id, roles = [], account = "") => {
  const contract = await getCollecteurExportateurContract();

  const produitRaw = await contract.getLotProduit(_id);
  const collecteurAddr =
    produitRaw.collecteur?.toString?.() || produitRaw.collecteur || "";

  // Appliquer le filtre UNIQUEMENT si une adresse cible est fournie dans l'URL
  if (
    hasRole(roles, 3) &&
    produitRaw.collecteur.toLowerCase() !== account.toLowerCase()
  ) {
    return null;
  }

  // convertir en array
  const idCommandeRecoltes = Object.values(produitRaw.idCommandeRecoltes);
  let idRecoltes = Object.values(produitRaw.idRecolte);
  idRecoltes = [...new Set(idRecoltes)]; // supprime les doublants s'il existe

  let produitEnrichi = {
    id: _id,
    idRecolte: idRecoltes.map(el => Number(el)),
    idCommandeRecoltes: idCommandeRecoltes.map(el => Number(el)),
    quantite: Number(produitRaw.quantite ?? 0),
    prixUnit: Number(produitRaw.prix ?? 0),
    collecteur: {...await getActeur(collecteurAddr), adresse: collecteurAddr},
    cid: produitRaw.cid,
    hashMerkle: produitRaw.hashMerkle || "",
  };
  

  // Enrichir depuis le fichier ipfs
  const res = await getFileFromPinata(produitRaw.cid);
  produitEnrichi = {
    ...res?.data?.items,
    ...res?.keyvalues,
    ...produitEnrichi,
  }
  
  return produitEnrichi;
};

/**
 * 
 * @param {number} _idCommande 
 * @returns 
 */
export const getConditionTransportCE = async (_idCommande) => {
  const contrat = await getCollecteurExportateurContract();
  let conditionComplet = {};
  // recuperer conditions transport on-chain
  try {
    const conditionOnChain = await contrat.getCondition(_idCommande);
    conditionComplet = {
      id: conditionOnChain.id,
      cid: conditionOnChain.cid,
      hashMerkle: conditionOnChain.hashMerkle,
    };
  } catch (error) {
    console.error("Erreur recuperation condition transport CE : ", error);
    return;
  }
  // si il n'y a pas de cid, on arrete
  if (!conditionComplet.cid || conditionComplet.cid === "") {
    return conditionComplet;
  }
  // recuperer conditions transport ipfs
  const conditionIpfs = await getFileFromPinata(conditionComplet.cid);
  conditionComplet = {
    ...conditionComplet,
    ...conditionIpfs.data.items,
    ...conditionIpfs?.keyvalues
  };
  return conditionComplet;
};

/**
 * 
 * @param {number} _idCommande 
 * @returns 
 */
export const getCommandeProduit = async (_idCommande) => {
  const contrat = await getCollecteurExportateurContract();

  try {
    const res = await contrat.getCommande(_idCommande);

    const collecteurDetails = await getActeur(res.collecteur?.toString());
    const exportateurDetails = await getActeur(res.exportateur?.toString());
    const transporteurDetails = res.transporteur !== ethers.ZeroAddress ? await getActeur(res.transporteur.toString()):{};

    return {
      id: Number(res.id),
      idLotProduit: Number(res.idLotProduit),
      quantite: Number(res.quantite),
      prix: Number(res.prix),
      statutTransport: Number(res.statutTransport),
      statutProduit: Number(res.statutProduit),
      payer: res.payer,
      collecteur: {...collecteurDetails, adresse: res.collecteur?.toString()},
      exportateur: {...exportateurDetails, adresse: res.exportateur?.toString()},
      transporteur: {...transporteurDetails, adresse: res.transporteur?.toString()},
      enregistre: res.enregistre,
      enregistrerCondition: res.enregistrerCondition,
    };
  } catch (error) {
    console.log("Recuperation commande lot produit : ", error);
    return {};
  }
};
