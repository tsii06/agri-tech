import { getContract, getProducteurContract } from "../contract";
import { ajouterKeyValuesFileIpfs, deleteFromIPFSByCid, getFileFromPinata } from "../ipfsUtils";
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
    const producteurDetails = await getActeur(
      parcelleOnChain.producteur.toString()
    );
    parcelleComplet = {
      id: Number(parcelleOnChain.id),
      cid: parcelleOnChain.cid.toString(),
      producteur: {
        ...producteurDetails,
        adresse: parcelleOnChain.producteur.toString(),
      },
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
    ...parcelleIpfs?.data?.items,
    ...parcelleIpfs?.keyvalues,
    dataOffChain: parcelleIpfs !== false, // pour savoir si il y a des dataOffChain
  };
};

/**
 *
 * @param {object} parcelleData
 * @param {string} cidCertificat
 */
export const createParcelle = async (parcelleData, location, cidCertificat) => {
  let parcelleCid = '';
  try {
    const contract = await getContract();

    // Créer l'objet parcelle consolidé pour IPFS
    const parcelleConsolidee = {
      qualiteSemence: parcelleData.qualiteSemence,
      methodeCulture: parcelleData.methodeCulture,
      dateRecolte: parcelleData.dateRecolte,
      location: {
        lat: location.lat,
        lng: location.lng,
      },
      certificat: cidCertificat,
      photos: parcelleData.photos,
      intrants: parcelleData.intrants,
      inspections: parcelleData.inspections,
      timestamp: Date.now(),
    };

    // Upload des données consolidées de la parcelle sur IPFS
    const { uploadConsolidatedData } = await import("../../utils/ipfsUtils");
    const parcelleUpload = await uploadConsolidatedData(
      parcelleConsolidee,
      "parcelle"
    );
    parcelleCid = parcelleUpload.cid;

    if (!parcelleUpload.success) {
      throw new Error("Erreur lors de l'upload des données de la parcelle");
    }

    // CREATION PARCELLE avec le nouveau format
    const tx = await contract.creerParcelle(parcelleUpload.cid);
    await tx.wait();

    // Ajouter la hash transaction dans le keyvalues du fichier sur ipfs
    await ajouterKeyValuesFileIpfs(parcelleCid, { hashTransaction: tx.hash.toString() });

    return tx;
  } catch (error) {
    console.error("Creation parcelle : ", error);
    // supprimer le certificat sur ipfs si erreur
    if (cidCertificat && cidCertificat !== "") deleteFromIPFSByCid(cidCertificat);
    // supprimer parcelle sur ipfs
    if (parcelleCid && parcelleCid !== "") deleteFromIPFSByCid(parcelleCid);
    return false;
  }
};
