import { ethers } from "ethers";
import { getCollecteurProducteurContract } from "../contract";
import { ajouterKeyValuesFileIpfs, deleteFromIPFSByCid, getFileFromPinata, uploadConsolidatedData } from "../ipfsUtils";
import { getActeur } from "./gestionnaireActeurs";

const contrat = await getCollecteurProducteurContract();

/**
 *
 * @param {number} _idCommande
 * @returns
 */
export const getCommandeRecolte = async (_idCommande) => {
  try {
    const res = await contrat.getCommande(_idCommande);

    const producteurDetails = await getActeur(res.producteur.toString());
    const collecteurDetails = await getActeur(res.collecteur.toString());
    const transporteurDetails = res.transporteur !== ethers.ZeroAddress ? await getActeur(res.transporteur.toString()):{};

    return {
      id: Number(res.id),
      idRecolte: Number(res.idRecolte),
      quantite: Number(res.quantite),
      prix: Number(res.prix),
      statutTransport: Number(res.statutTransport),
      statutRecolte: Number(res.statutRecolte),
      payer: res.payer,
      producteur: { ...producteurDetails, adresse: res.producteur.toString() },
      collecteur: { ...collecteurDetails, adresse: res.collecteur.toString() },
      enregistrerCondition: res.enregistrerCondition,
      transporteur: { ...transporteurDetails, adresse: res.transporteur.toString() },
    };
  } catch (error) {
    console.log("Recuperation commande lot produit : ", error);
    return {};
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
  // si il n'y a pas de cid, on arrete
  if (!conditionComplet.cid || conditionComplet.cid === "") {
    return conditionComplet;
  }
  // recuperer conditions transport ipfs
  const conditionIpfs = await getFileFromPinata(conditionComplet.cid);
  conditionComplet = {
    ...conditionComplet,
    ...conditionIpfs.data.items,
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
    // recuperer details acteur
    const producteurDetails = await getActeur(
      recolteOnChain.producteur.toString()
    );

    recolteComplet = {
      id: Number(recolteOnChain.id),
      quantite: Number(recolteOnChain.quantite),
      prixUnit: Number(recolteOnChain.prixUnit),
      idParcelle: idParcelles.map((id) => Number(id)),
      certifie: recolteOnChain.certifie,
      certificatPhytosanitaire:
        recolteOnChain.certificatPhytosanitaire.toString(),
      producteur: {
        ...producteurDetails,
        adresse: recolteOnChain.producteur.toString(),
      },
      hashMerkle: recolteOnChain.hashMerkle.toString(),
      cid: recolteOnChain.cid.toString(),
    };
  } catch (error) {
    console.error("Recuperation recolte : ", error);
  }

  // recuperation info off-chain
  if (recolteComplet.cid && recolteComplet.cid !== "") {
    const recolteIpfs = await getFileFromPinata(recolteComplet.cid);
    // Format : jour mois année
    let dateRecolteFormat = "N/A";
    if (recolteIpfs.data.items.dateRecolte && recolteIpfs.data.items.dateRecolte !== "") {
      dateRecolteFormat = new Date(recolteIpfs.data.items.dateRecolte)
        .toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
    }

    return {
      ...recolteIpfs.data.items,
      ...recolteIpfs?.keyvalues,
      ...recolteComplet,
      dateRecolte: dateRecolteFormat,
    };
  } else {
    return recolteComplet;
  }
};

/**
 * 
 * @param {object} recolteData 
 * @param {object} parcelle 
 */
export const createRecolte = async (recolteData, parcelle) => {
  let cidRecolte = '';
  try {
    // 1. Créer l'objet récolte consolidé pour IPFS
    const recolteConsolidee = {
      type: "recolte",
      parcelleId: parseInt(parcelle.id),
      nomProduit: recolteData.nomProduit,
      quantite: parseInt(recolteData.quantite),
      prix: parseInt(recolteData.prix),
      dateRecolte: recolteData.dateRecolte,
      producteur: parcelle.producteur?.adresse,
      parcelleHashMerkle: parcelle?.hashMerkle || "",
      timestamp: Date.now(),
      version: "1.0",
    };

    // 2. Upload des données consolidées sur IPFS
    const recolteUpload = await uploadConsolidatedData(
      recolteConsolidee,
      "recolte"
    );
    cidRecolte = recolteUpload.cid;
    if (!recolteUpload.success) {
      throw new Error(
        "Erreur lors de l'upload des données de récolte sur IPFS"
      );
    }

    // 3. Créer la récolte avec le CID IPFS
    const tx = await contrat.ajoutRecolte(
      [parseInt(parcelle.id)], // Tableau de parcelles
      parseInt(recolteData.quantite),
      parseInt(recolteData.prix),
      recolteUpload.cid // CID IPFS
    );
    await tx.wait();

    // 4. Ajouter hash transaction aux keyvalues du fichier recolte sur ipfs
    await ajouterKeyValuesFileIpfs(recolteUpload.cid, { hashTransaction: tx.hash});
  } catch (error) {
    console.error("Creation recolte :", error);

    // supprimer le fichier sur ipfs si erreur
    if (cidRecolte !== "") deleteFromIPFSByCid(cidRecolte);

    throw new Error("Creation recolte.");
  }
};
