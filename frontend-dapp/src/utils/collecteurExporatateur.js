import { getCollecteurExportateurContract } from "./contract";
import { getIPFSURL } from "./ipfsUtils";
import { hasRole } from "./roles";

/**
 *
 * @param {number} _id id du lot produit
 * @param {Array} roles les roles de l'user
 * @param {string} account adresse de l'user
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

  let produitEnrichi = {
    id: _id,
    idRecolte: [...new Set(produitRaw.idRecolte)], // supprime les doublants s'il existe
    nom: "",
    quantite: Number(produitRaw.quantite ?? 0),
    prixUnit: produitRaw.prix ?? 0,
    collecteur: collecteurAddr,
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
    // laisser valeurs par défaut
  }
};
