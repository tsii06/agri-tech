import { getCollecteurExportateurContract } from "./contract";
import { getActeur } from "./contrat/gestionnaireActeurs";
import { getFileFromPinata, getIPFSURL } from "./ipfsUtils";
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
  const idRecoltes = Object.values(produitRaw.idRecolte);

  let produitEnrichi = {
    id: _id,
    idRecolte: [...new Set(idRecoltes)], // supprime les doublants s'il existe
    idCommandeRecoltes: idCommandeRecoltes.map(el => Number(el)),
    nom: "",
    quantite: Number(produitRaw.quantite ?? 0),
    prixUnit: produitRaw.prix ?? 0,
    collecteur: await getActeur(collecteurAddr),
    cid: produitRaw.cid,
    hashMerkle: produitRaw.hashMerkle || "",
  };

  // Enrichir depuis le fichier ipfs
  try {
    const res = await fetch(getIPFSURL(produitRaw.cid));
    if (res.ok) {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const ipfsData = await res.json();
        const root = ipfsData && ipfsData.items ? ipfsData.items : ipfsData;
        produitEnrichi.nom = root.nom || produitEnrichi.nom || "Produit";
        produitEnrichi.ipfsTimestamp = ipfsData.timestamp || null;
        produitEnrichi.ipfsVersion = ipfsData.version || null;
      }
    }
    return produitEnrichi;
  } catch (e) {
    console.error("Erreur lors de la recuperation d'infos sur  un lot de produit : ", e);
    return null;
  }
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
 * @param {number} _idCommande 
 * @returns 
 */
export const getCommandeProduit = async (_idCommande) => {
  const contrat = await getCollecteurExportateurContract();
  try {
    const res = await contrat.getCommande(_idCommande);
    return {
      id: Number(res.id),
      idLotProduit: Number(res.idLotProduit),
      quantite: Number(res.quantite),
      prix: Number(res.prix),
      statutTransport: Number(res.statutTransport),
      statutProduit: Number(res.statutProduit),
      payer: res.payer,
      collecteur: res.collecteur.toString(),
      exportateur: res.exportateur.toString(),
      enregistre: res.enregistre,
      enregistrerCondition: res.enregistrerCondition,
      transporteur: res.transporteur.toString(),
    };
  } catch (error) {
    console.log("Recuperation commande lot produit : ", error);
  }
};
