import { getContract, getProducteurContract } from "../contract";
import {
  ajouterKeyValuesFileIpfs,
  deleteFromIPFSByCid,
  getFileFromPinata,
} from "../ipfsUtils";
import { hasRole } from "../roles";
import { getActeur } from "./gestionnaireActeurs";

const contrat = await getProducteurContract();

/**
 *
 * @param {number} _idParcelle
 * @returns {object}
 */
export const getParcelle = async (_idParcelle, _roles = [], _account = "") => {
  let parcelleComplet = {};
  console.log(`🔍 Début récupération parcelle ${_idParcelle}`);

  // Recuperer info on-chain
  try {
    const parcelleOnChain = await contrat.getParcelle(_idParcelle);

    // Vérifier si on doit filtrer par propriétaire
    if (_roles.length > 0 && _account !== "" && hasRole(_roles, 0)) {
      if (
        parcelleOnChain.producteur?.toLowerCase() !==
        _account?.toLowerCase()
      ) {
        console.log(`⏭️ Parcelle ${_idParcelle} ignorée: pas le bon propriétaire`);
        return { isProprietaire: false };
      }
    }

    console.log(`🔍 Parcelle ${_idParcelle} on-chain:`, {
      id: Number(parcelleOnChain.id),
      producteur: parcelleOnChain.producteur.toString(),
      cid: parcelleOnChain.cid.toString(),
      hashMerkle: parcelleOnChain.hashMerkle?.toString(),
    });

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
    console.error(
      `❌ Erreur récupération parcelle ${_idParcelle} on-chain:`,
      error
    );
    return {};
  }

  if (!parcelleComplet.cid || parcelleComplet.cid === "") {
    console.log(
      `⚠️ Parcelle ${_idParcelle}: Pas de CID, retour données on-chain uniquement`
    );
    return { ...parcelleComplet, dataOffChain: false };
  }

  // recuperation data off-chain
  console.log(`🌐 Récupération données IPFS pour CID: ${parcelleComplet.cid}`);
  const parcelleIpfs = await getFileFromPinata(parcelleComplet.cid);

  if (parcelleIpfs === false) {
    console.log(`❌ Échec récupération IPFS pour parcelle ${_idParcelle}`);
    return {
      ...parcelleComplet,
      dataOffChain: false,
    };
  }

  console.log(`✅ Données IPFS récupérées pour parcelle ${_idParcelle}:`, {
    data: parcelleIpfs?.data?.items
      ? Object.keys(parcelleIpfs.data.items)
      : "pas de data.items",
    keyvalues: parcelleIpfs?.keyvalues
      ? Object.keys(parcelleIpfs.keyvalues)
      : "pas de keyvalues",
  });

  return {
    ...parcelleComplet,
    ...parcelleIpfs?.data?.items,
    ...parcelleIpfs?.keyvalues,
    isProprietaire: true,
    dataOffChain: parcelleIpfs !== false, // pour savoir si il y a des dataOffChain
  };
};

/**
 *
 * @param {object} parcelleData
 * @param {string} cidCertificat
 */
export const createParcelle = async (parcelleData, location, cidCertificat) => {
  let parcelleCid = "";
  console.log("🌱 Début création parcelle:", {
    parcelleData,
    location,
    cidCertificat,
  });

  try {
    const contract = await getContract();

    // Vérifier le compteur avant création
    const compteurAvant = await contract.getCompteurParcelle();
    console.log("🗺️ Compteur parcelles avant création:", Number(compteurAvant));

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

    console.log("📝 Données parcelle à uploader:", parcelleConsolidee);

    // Upload des données consolidées de la parcelle sur IPFS
    const { uploadConsolidatedData } = await import("../../utils/ipfsUtils");
    const parcelleUpload = await uploadConsolidatedData(
      parcelleConsolidee,
      "parcelle"
    );
    parcelleCid = parcelleUpload.cid;

    console.log("🌐 Upload IPFS réussi:", {
      cid: parcelleCid,
      success: parcelleUpload.success,
    });

    if (!parcelleUpload.success) {
      throw new Error("Erreur lors de l'upload des données de la parcelle");
    }

    // CREATION PARCELLE avec le nouveau format
    console.log("🔗 Création parcelle sur blockchain...");
    const tx = await contract.creerParcelle(parcelleUpload.cid);
    console.log("⏳ Transaction envoyée:", tx.hash);

    const receipt = await tx.wait();
    console.log("✅ Transaction confirmée:", receipt);

    // Vérifier le compteur après création
    const compteurApres = await contract.getCompteurParcelle();
    console.log("🗺️ Compteur parcelles après création:", Number(compteurApres));
    console.log("🎉 Nouvelle parcelle créée avec ID:", Number(compteurApres));

    // Ajouter la hash transaction dans le keyvalues du fichier sur ipfs
    await ajouterKeyValuesFileIpfs(parcelleCid, {
      hashTransaction: tx.hash.toString(),
    });
    console.log("🔑 Métadonnées ajoutées à IPFS");

    return tx;
  } catch (error) {
    console.error("❌ Erreur création parcelle:", error);
    // supprimer le certificat sur ipfs si erreur
    if (cidCertificat && cidCertificat !== "") {
      console.log("🧹 Nettoyage: suppression certificat IPFS");
      deleteFromIPFSByCid(cidCertificat);
    }
    // supprimer parcelle sur ipfs
    if (parcelleCid && parcelleCid !== "") {
      console.log("🧹 Nettoyage: suppression parcelle IPFS");
      deleteFromIPFSByCid(parcelleCid);
    }
    return false;
  }
};
