import { ethers } from "ethers";
import { getCollecteurExportateurContract } from "./contract";
import { getActeur } from "./contrat/gestionnaireActeurs";
import { getFileFromPinata } from "./ipfsUtils";
import { hasRole } from "./roles";
import { collecteurExportateurRead } from "../config/onChain/frontContracts";
import { getRecolte } from "./contrat/collecteurProducteur";

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
    return { isProprietaire: false };
  }

  // convertir en array
  const idCommandeRecoltes = Object.values(produitRaw.idCommandeRecoltes);
  let idRecoltes = Object.values(produitRaw.idRecolte);
  idRecoltes = [...new Set(idRecoltes)]; // supprime les doublants s'il existe

  let produitEnrichi = {
    id: _id,
    idRecolte: idRecoltes.map((el) => Number(el)),
    idCommandeRecoltes: idCommandeRecoltes.map((el) => Number(el)),
    quantite: Number(produitRaw.quantite ?? 0),
    prixUnit: Number(produitRaw.prix ?? 0),
    collecteur: {
      ...(await getActeur(collecteurAddr)),
      adresse: collecteurAddr,
    },
    cid: produitRaw.cid,
    hashMerkle: produitRaw.hashMerkle || "",
  };

  // Enrichir depuis le fichier ipfs
  const res = await getFileFromPinata(produitRaw.cid);
  produitEnrichi = {
    ...res?.data?.items,
    ...res?.keyvalues,
    ...produitEnrichi,
  };

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
    ...conditionIpfs?.keyvalues,
  };
  return conditionComplet;
};

/**
 *
 * @param {number} _idCommande
 * @returns
 */
export const getCommandeProduit = async (_idCommande) => {
  try {
    const res = await collecteurExportateurRead.read(
      "getCommande",
      _idCommande
    );

    const collecteurDetails = await getActeur(res.collecteur?.toString());
    const exportateurDetails = await getActeur(res.exportateur?.toString());
    const transporteurDetails =
      res.transporteur !== ethers.ZeroAddress
        ? await getActeur(res.transporteur.toString())
        : {};

    return {
      id: Number(res.id),
      idLotProduit: Number(res.idLotProduit),
      quantite: Number(res.quantite),
      prix: Number(res.prix),
      statutTransport: Number(res.statutTransport),
      statutProduit: Number(res.statutProduit),
      payer: res.payer,
      collecteur: { ...collecteurDetails, adresse: res.collecteur?.toString() },
      exportateur: {
        ...exportateurDetails,
        adresse: res.exportateur?.toString(),
      },
      transporteur: {
        ...transporteurDetails,
        adresse: res.transporteur?.toString(),
      },
      enregistre: res.enregistre,
      enregistrerCondition: res.enregistrerCondition,
    };
  } catch (error) {
    console.error("Recuperation commande lot produit : ", error);
    return {};
  }
};

// Recuperer un produit enrichie.
export const getProduitEnrichi = async (id, roles = [], account = "") => {
  const produitRaw = await collecteurExportateurRead.read("getProduit", id);
  const collecteurAddr =
    produitRaw.collecteur?.toString?.() || produitRaw.collecteur || "";
  // Appliquer pour collecteur.
  if (
    hasRole(roles, 3) &&
    produitRaw.collecteur.toLowerCase() !== account.toLowerCase()
  )
    return { isProprietaire: false };

  // ne plus afficher les produits enregistrer
  if (produitRaw.enregistre) return { isProprietaire: false };

  let produitEnrichi = {
    id: id,
    idRecolte: Number(produitRaw.idRecolte ?? 0),
    quantite: Number(produitRaw.quantite ?? 0),
    statut: Number(produitRaw.statut ?? produitRaw.enregistre ?? 0),
    collecteur:
      collecteurAddr && collecteurAddr !== ""
        ? await getActeur(collecteurAddr)
        : null,
    hashMerkle: produitRaw.hashMerkle || "",
    enregistre: produitRaw.enregistre || 0,
  };

  // Enrichir depuis la récolte associée (prixUnit et CID JSON)
  try {
    if (produitEnrichi.idRecolte > 0) {
      const recolteRaw = await getRecolte(produitEnrichi.idRecolte);
      produitEnrichi.certificatPhytosanitaire =
        recolteRaw.certificatPhytosanitaire?.toString?.() ||
        recolteRaw.certificatPhytosanitaire ||
        "";
      produitEnrichi.nom = recolteRaw.nomProduit;
      produitEnrichi.dateRecolte = recolteRaw.dateRecolte;
      produitEnrichi.ipfsTimestamp = recolteRaw.timestamp || null;
      produitEnrichi.ipfsVersion = recolteRaw.version || null;
      produitEnrichi.recolteHashMerkle = recolteRaw.parcelleHashMerkle || "";
    }

    return produitEnrichi;
  } catch (error) {
    console.error("Erreur recuperation stock collecteur : ", error);
  }
};

// Recuperer commandes lots produits enrichi
export const getCommandeLotProduitEnrichi = async (
  id,
  roles = [],
  account = "",
  isStock = false
) => {
  try {
    const commandeRaw = await getCommandeProduit(id);

    // ne pas afficher les commandes deja enregistrer dans le stock ou non payer
    if (isStock && (commandeRaw.enregistre || !commandeRaw.payer))
      return { isProprietaire: false };

    // Normaliser adresses
    const exportateurAddr =
      commandeRaw.exportateur?.adresse.toString?.() ||
      commandeRaw.exportateur ||
      "";
    const transporteurAddr =
      commandeRaw.transporteur?.adresse.toString?.() ||
      commandeRaw.transporteur ||
      "";

    if (!exportateurAddr) return { isProprietaire: false };

    // Vérifier si la commande appartient à l'exportateur connecté, si user est exportateur
    if (
      hasRole(roles, 6) &&
      exportateurAddr.toLowerCase() !== account.toLowerCase()
    )
      return { isProprietaire: false };

    // Filtrer les commandes si user transporteur
    if (
      hasRole(roles, 5) &&
      transporteurAddr.toLowerCase() !== account.toLowerCase()
    )
      return { isProprietaire: false };

    // Normaliser types primitifs
    const idLotProduitNum = Number(commandeRaw.idLotProduit ?? 0);
    const produit =
      idLotProduitNum > 0 ? await getLotProduitEnrichi(idLotProduitNum) : {};

    let commandeEnrichie = {
      ...commandeRaw,
      idLotProduit: idLotProduitNum,
      nomProduit: produit?.nom || "",
    };

    // Charger les condition de transport
    if (commandeRaw.enregistrerCondition) {
      const conditions = await getConditionTransportCE(id);
      commandeEnrichie = {
        ...commandeEnrichie,
        ...conditions,
      };
    }
    return commandeEnrichie;
  } catch (error) {
    console.error(`Erreur recuperation commande ID ${id} :`, error);
  }
};
