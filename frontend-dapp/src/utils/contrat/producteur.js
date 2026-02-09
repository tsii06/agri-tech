import {
  getProducteurEnPhaseCultureWrite,
  producteurEnPhaseCultureRead,
} from "../../config/onChain/frontContracts";
import { DEBUT_PARCELLE } from "../contract";
import {
  ajouterKeyValuesFileIpfs,
  deleteFromIPFSByCid,
  getFileFromPinata,
} from "../ipfsUtils";
import { hasRole } from "../roles";
import { getActeur } from "./gestionnaireActeurs";

/**
 *
 * @param {number} _idParcelle
 * @returns {object}
 */
export const getParcelle = async (_idParcelle, _roles = [], _account = "") => {
  let parcelleComplet = {};

  // Recuperer info on-chain
  try {
    const parcelleOnChain = await producteurEnPhaseCultureRead.read(
      "getParcelle",
      _idParcelle
    );

    // Vérifier si on doit filtrer par propriétaire si user producteur
    if (_roles.length > 0 && _account !== "" && hasRole(_roles, 0)) {
      if (
        parcelleOnChain.producteur?.toLowerCase() !== _account?.toLowerCase()
      ) {
        return { isProprietaire: false };
      }
    }

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
  const parcelleIpfs = await getFileFromPinata(parcelleComplet.cid);

  if (parcelleIpfs === false) {
    console.log(`❌ Échec récupération IPFS pour parcelle ${_idParcelle}`);
    return {
      ...parcelleComplet,
      dataOffChain: false,
    };
  }

  return {
    ...parcelleComplet,
    ...parcelleIpfs?.data?.items,
    ...parcelleIpfs?.keyvalues,
    isProprietaire: true,
    dataOffChain: parcelleIpfs !== false, // pour savoir si il y a des dataOffChain
  };
};

// Recuperer tous les parcelles
export const getAllParcelles = async () => {
  try {
    const compteurParcellesRaw = await producteurEnPhaseCultureRead.read(
      "getCompteurParcelle"
    );
    const compteurParcelles = Number(compteurParcellesRaw);

    if (compteurParcelles === 0) {
      console.log("⚠️ Aucune parcelle trouvée sur la blockchain");
      return;
    }

    const parcellesDebug = [];
    let i;

    // Utiliser DEBUT_PARCELLE comme point de départ
    for (i = compteurParcelles; i >= DEBUT_PARCELLE; i--) {
      try {
        const parcelleRaw = await getParcelle(i);

        // Ne pas afficher si il n y a pas de data off-chain
        if (!parcelleRaw.dataOffChain) {
          continue;
        }

        parcellesDebug.push(parcelleRaw);
      } catch (error) {
        console.error(
          `❌ Erreur lors du chargement de la parcelle ${i}:`,
          error
        );
      }
    }
    console.log("Tous les parcelles :", parcellesDebug);
    return parcellesDebug;
  } catch (error) {
    console.error("❌ Erreur détaillée:", error);
    return;
  }
};

// Recuperer tous les parcelles d'un producteur
export const getParcellesProducteur = async (_account) => {
  try {
    const compteurParcellesRaw = await producteurEnPhaseCultureRead.read(
      "getCompteurParcelle"
    );
    const compteurParcelles = Number(compteurParcellesRaw);

    if (compteurParcelles === 0) {
      console.log("⚠️ Aucune parcelle trouvée sur la blockchain");
      return;
    }

    const parcellesDebug = [];
    let i;

    // Utiliser DEBUT_PARCELLE comme point de départ
    for (i = compteurParcelles; i >= DEBUT_PARCELLE; i--) {
      try {
        const parcelleRaw = await getParcelle(i, [0], _account);

        // Ne pas afficher si il n y a pas de data off-chain
        if (!parcelleRaw.dataOffChain) {
          continue;
        }

        // Vérifier si on doit filtrer par propriétaire
        if (!parcelleRaw.isProprietaire) continue;

        parcellesDebug.push(parcelleRaw);
      } catch (error) {
        console.error(
          `❌ Erreur lors du chargement de la parcelle ${i}:`,
          error
        );
      }
    }
    console.log("Tous les parcelles du producteur :", parcellesDebug);
    return parcellesDebug;
  } catch (error) {
    console.error("❌ Erreur détaillée:", error);
    return;
  }
};

/**
 *
 * @param {object} parcelleData
 * @param {string} cidCertificat
 */
export const createParcelle = async (parcelleData, location, cidCertificat) => {
  let parcelleCid = "";

  try {
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
    console.log("🔗 Création parcelle sur blockchain...");
    const contract = await getProducteurEnPhaseCultureWrite();
    const tx = await contract.write("creerParcelle", [parcelleUpload.cid]);
    console.log("⏳ Transaction envoyée:", tx.hash);

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
