import {
  apiGetFileFromPinata,
  apiUploadConsolidatedData,
} from "../api/frontApiPinata";
import { getProducteurEnPhaseCultureWrite } from "../config/onChain/frontContracts";
import myPinataSDK from "./pinata";

/**
 * Upload un fichier sur IPFS avec des métadonnées spécifiques
 * @param {File} file - Le fichier à uploader
 * @param {Object} metadata - Les métadonnées du fichier
 * @returns {Promise<Object>} L'objet de réponse IPFS avec CID
 */
export const uploadToIPFS = async (
  file,
  metadata = {},
  type = "madtx-file"
) => {
  try {
    const res = await myPinataSDK.upload.public
      .file(file)
      .keyvalues(metadata)
      .name(`${type}-${Date.now()}`);

    if (res.is_duplicate) {
      alert("Ce fichier a déjà été uploadé sur IPFS.");
      throw new Error("Ce fichier a déjà été uploadé sur IPFS.");
    }

    return {
      success: true,
      cid: res.cid,
      ipfsHash: res.IpfsHash,
      id: res.id,
    };
  } catch (error) {
    console.error("Erreur lors de l'upload IPFS:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Uploader un objet js dans ipfs sous forme de json
 * @param {object} data
 * @param {string} type
 * @param {object} metadata
 * @returns
 */
export const uploadJsonToIpfs = async (data, type, metadata = {}) => {
  try {
    const res = await myPinataSDK.upload.public
      .json(data)
      .name(`${type}-${Date.now()}.json`)
      .keyvalues(metadata);
    return { ...res, success: true };
  } catch (error) {
    console.error("Erreur upload json : ", error);
  }
};

/**
 * Upload des photos de parcelle sur IPFS
 * @param {File} file - Le fichier photo
 * @param {string} parcelleId - L'ID de la parcelle
 * @returns {Promise<Object>} L'objet de réponse IPFS
 */
export const uploadPhotoParcelle = async (file, parcelleId) => {
  const metadata = {
    type: "photo-parcelle",
    parcelleId: parcelleId,
    timestamp: Date.now().toString(),
  };
  return await uploadToIPFS(file, metadata, "photo-parcelle");
};

/**
 * Upload des intrants sur IPFS
 * @param {File} file - Le fichier intrant
 * @param {Object} intrantData - Les données de l'intrant
 * @returns {Promise<Object>} L'objet de réponse IPFS
 */
export const uploadIntrant = async (intrantData) => {
  const resIntrant = await uploadConsolidatedData(intrantData, "intrant", {
    valider: "false",
    certificat: "",
  });

  return resIntrant;
};

/**
 * Ajoute/Met à jour un intrant (avec dateAjout) sur la parcelle (master consolidé)
 */
export const addIntrantToParcelleMaster = async (
  parcelle,
  intrant,
  dateAjoutISO
) => {
  // Charger master existant
  let master = await getMasterFromCid(parcelle?.cid);
  if (!master || typeof master !== "object") master = {};

  const newIntrant = {
    ...intrant,
    dateAjout: dateAjoutISO || new Date().toISOString().slice(0, 10),
  };

  const list = Array.isArray(master.intrants) ? master.intrants : [];
  const merged = [...list, newIntrant];

  // Ré-upload consolidé et mise à jour de la parcelle
  return await updateCidParcelle(parcelle, merged, "intrants");
};

/**
 * Enrichit une récolte (objet master) avec saison dynamique et intrantsUtilises
 * @param {Object} recolte - Objet récolte
 * @param {Object} parcelle - Objet parcelle
 * @returns {Promise<Object>} Récolte enrichie avec données IPFS
 */
export const enrichRecolteWithSeasonAndInputs = async (recolte, parcelle) => {
  try {
    // Récupérer les intrants de la parcelle
    let intrantsParcelle = [];
    let dateRecoltePrecedente = null;
    let numeroRecolte = 1;

    try {
      const masterParcelle = await getMasterFromCid(parcelle?.cid);
      intrantsParcelle = Array.isArray(masterParcelle?.intrants)
        ? masterParcelle.intrants
        : [];

      // Calculer le numéro de récolte et la date précédente
      const { getRecoltesParParcelle, getDateRecoltePrecedente } = await import(
        "./contrat/collecteurProducteur"
      );
      const recoltesExistantes = await getRecoltesParParcelle(parcelle.id);
      numeroRecolte = await calculateNumeroRecolte(
        parcelle.id,
        recolte.dateRecolte,
        recoltesExistantes
      );
      dateRecoltePrecedente = await getDateRecoltePrecedente(
        parcelle.id,
        recolte.dateRecolte
      );
    } catch (error) {
      console.warn("Erreur récupération données parcelle:", error);
    }

    // Calculer la saison dynamique
    const saison = computeSeasonFromDate(
      recolte?.dateRecolte,
      dateRecoltePrecedente,
      intrantsParcelle,
      parcelle?.id,
      numeroRecolte
    );

    // Filtrer les intrants selon la nouvelle règle
    const intrantsUtilises = filterIntrantsForHarvest(
      intrantsParcelle,
      recolte?.dateRecolte,
      dateRecoltePrecedente
    );

    const enriched = {
      ...(recolte || {}),
      saison,
      intrantsUtilises,
      dateRecoltePrecedente,
      numeroRecolte,
      timestamp: Date.now(),
      version: "2.1", // Version avec saison dynamique
    };

    return await uploadConsolidatedData(enriched, "recolte");
  } catch (error) {
    console.error("Erreur enrichissement récolte:", error);
    throw error;
  }
};

/**
 * Upload des inspections sur IPFS
 * @param {File} file - Le fichier d'inspection
 * @param {Object} inspectionData - Les données de l'inspection
 * @returns {Promise<Object>} L'objet de réponse IPFS
 */
export const uploadInspection = async (file, inspectionData) => {
  const metadata = {
    type: "inspection",
    parcelleId: inspectionData.parcelleId,
    auditeur: inspectionData.auditeur,
    rapport: inspectionData.rapport,
    timestamp: Date.now().toString(),
  };
  if (file !== null)
    return await uploadToIPFS(file, metadata, "inspection-parcelle");
  else return await uploadJsonToIpfs(inspectionData, "inspection", metadata);
};

/**
 * Upload des conditions de transport sur IPFS
 * @param {File} file - Le fichier des conditions
 * @param {Object} conditionData - Les données des conditions
 * @returns {Promise<Object>} L'objet de réponse IPFS
 */
export const uploadConditionTransport = async (file, conditionData) => {
  const metadata = {
    type: "condition-transport",
    commandeId: conditionData.commandeId,
    transporteur: conditionData.transporteur,
    temperature: conditionData.temperature,
    humidite: conditionData.humidite,
    timestamp: Date.now().toString(),
  };
  return await uploadToIPFS(file, metadata, "condition-transport");
};

/**
 * Upload des certificats phytosanitaires sur IPFS
 * @param {File} file - Le fichier certificat
 * @param {Object} certificatData - Les données du certificat
 * @returns {Promise<Object>} L'objet de réponse IPFS
 */
export const uploadCertificatPhytosanitaire = async (file, certificatData) => {
  const metadata = {
    type: "certificat-phytosanitaire",
    ...certificatData,
  };
  return await uploadToIPFS(
    file,
    stringifyAll(metadata),
    "certificat-phytosanitaire"
  );
};
// Fonction récursive pour tout transformer en string
export function stringifyAll(obj) {
  if (Array.isArray(obj)) {
    return obj.map(stringifyAll);
  } else if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, stringifyAll(v)])
    );
  } else {
    return String(obj);
  }
}

/**
 * Récupère l'URL IPFS à partir d'un CID
 * @param {string} cid - Le CID IPFS
 * @param {string} gateway - Le gateway IPFS (optionnel)
 * @returns {string} L'URL complète
 */
export const getIPFSURL = (
  cid,
  gateway = "https://bronze-kind-spider-769.mypinata.cloud"
) => {
  if (!cid) return "";
  return `${gateway}/ipfs/${cid}`;
};

/**
 * Récupère le JSON "master" depuis un CID IPFS (retourne l'objet racine items si présent)
 */
export const getMasterFromCid = async (cid) => {
  if (!cid) return {};
  try {
    const resp = await fetch(getIPFSURL(cid));
    if (!resp.ok) return {};
    const json = await resp.json();
    return json && json.items ? json.items : json;
  } catch (e) {
    console.error("Erreur getMasterFromCid:", e);
    return {};
  }
};

/**
 * Calcule la saison dynamique basée sur la période de culture d'une parcelle
 * @param {string} dateRecolte - Date de récolte (fin de culture)
 * @param {string|null} dateRecoltePrecedente - Date de la récolte précédente (ou null pour première récolte)
 * @param {Array} intrants - Liste des intrants de la parcelle pour déterminer le début de culture
 * @param {number} idParcelle - ID de la parcelle
 * @param {number} numeroRecolte - Numéro de la récolte pour cette parcelle (séquentiel)
 * @returns {Object|null} Objet saison avec période de culture réelle
 */
export const computeSeasonFromDate = (
  dateRecolte,
  dateRecoltePrecedente = null,
  intrants = [],
  idParcelle = null,
  numeroRecolte = 1
) => {
  if (!dateRecolte) return null;

  const dateFinCulture = new Date(dateRecolte);
  if (Number.isNaN(dateFinCulture.getTime())) return null;

  const year = dateFinCulture.getUTCFullYear();

  // 1. Déterminer le début de culture
  let dateDebutCulture;

  if (dateRecoltePrecedente) {
    // Pour les récoltes suivantes: début = jour après la récolte précédente
    const datePrecedente = new Date(dateRecoltePrecedente);
    dateDebutCulture = new Date(datePrecedente.getTime() + 24 * 60 * 60 * 1000); // +1 jour
  } else {
    // Pour la première récolte: chercher le premier intrant ajouté
    const intrantsAvecDate = intrants.filter((i) => i.dateAjout || i.timestamp);
    if (intrantsAvecDate.length > 0) {
      // Trouver le plus ancien intrant
      const datesIntrants = intrantsAvecDate
        .map((i) => {
          return i.dateAjout
            ? new Date(i.dateAjout).getTime()
            : Number(i.timestamp);
        })
        .filter((d) => !isNaN(d));

      if (datesIntrants.length > 0) {
        const premierIntrant = Math.min(...datesIntrants);
        dateDebutCulture = new Date(premierIntrant);
      } else {
        // Fallback: début d'année si aucun intrant trouvé
        dateDebutCulture = new Date(Date.UTC(year, 0, 1));
      }
    } else {
      // Fallback: début d'année si aucun intrant
      dateDebutCulture = new Date(Date.UTC(year, 0, 1));
    }
  }

  // 2. Calculer la durée de culture en jours
  const dureeCultureMs = dateFinCulture.getTime() - dateDebutCulture.getTime();
  const dureeCultureJours = Math.ceil(dureeCultureMs / (24 * 60 * 60 * 1000));

  // 3. Créer l'identifiant de saison : Année + Numéro de récolte
  const identifiantSaison = `${year}-R${numeroRecolte}`;
  const nomSaison = idParcelle
    ? `Culture ${identifiantSaison} (Parcelle ${idParcelle})`
    : `Culture ${identifiantSaison}`;

  return {
    nom: nomSaison,
    identifiant: identifiantSaison,
    annee: year,
    numeroRecolte: numeroRecolte,
    parcelle: idParcelle,
    dateDebut: dateDebutCulture.toISOString().slice(0, 10),
    dateFin: dateFinCulture.toISOString().slice(0, 10),
    dureeCultureJours: dureeCultureJours,
    typeSaison: "dynamique", // Pour différencier de l'ancien système H1/H2
    premierIntrant: dateRecoltePrecedente
      ? null
      : dateDebutCulture.toISOString().slice(0, 10),
  };
};

/**
 * Filtre les intrants d'une parcelle qui tombent dans la fenêtre de la saison dynamique
 * @param {Array} intrants - Liste des intrants
 * @param {Object} saison - Objet saison avec dateDebut et dateFin
 * @returns {Array} Intrants filtrés dans la période de culture
 */
export const filterIntrantsForSeason = (intrants = [], saison) => {
  if (!Array.isArray(intrants) || !saison) return [];
  const start = new Date(saison.dateDebut).getTime();
  const end = new Date(saison.dateFin).getTime();
  return intrants.filter((it) => {
    // priorité dateAjout (YYYY-MM-DD), fallback sur timestamp (ms)
    const t = it.dateAjout
      ? new Date(it.dateAjout).getTime()
      : it.timestamp
      ? Number(it.timestamp)
      : NaN;
    return Number.isFinite(t) && t >= start && t <= end;
  });
};

/**
 * Calcule le numéro de récolte pour une parcelle donnée
 * @param {number} idParcelle - ID de la parcelle
 * @param {string} dateRecolteActuelle - Date de la récolte actuelle
 * @param {Array} recoltesExistantes - Liste des récoltes existantes de la parcelle (optionnel)
 * @returns {Promise<number>} Numéro de récolte (1, 2, 3, etc.)
 */
export const calculateNumeroRecolte = async (
  idParcelle,
  dateRecolteActuelle,
  recoltesExistantes = null
) => {
  try {
    // Si les récoltes existantes ne sont pas fournies, les récupérer
    if (!recoltesExistantes) {
      // Import dynamique pour éviter la dépendance circulaire
      const { getRecoltesParParcelle } = await import(
        "./contrat/collecteurProducteur"
      );
      recoltesExistantes = await getRecoltesParParcelle(idParcelle);
    }

    // Filtrer les récoltes antérieures à la date actuelle
    const dateActuelle = new Date(dateRecolteActuelle).getTime();
    const recoltesAnterieures = recoltesExistantes.filter((r) => {
      const dateRecolte = new Date(r.dateRecolte).getTime();
      return dateRecolte < dateActuelle;
    });

    // Le numéro de récolte = nombre de récoltes antérieures + 1
    return recoltesAnterieures.length + 1;
  } catch (error) {
    console.warn("Erreur calcul numéro récolte:", error);
    return 1; // Fallback: première récolte
  }
};

/**
 * Filtre les intrants pour une récolte spécifique selon la règle :
 * - Intrants appliqués APRÈS la date de la récolte précédente
 * - ET AVANT ou À la date de récolte actuelle
 * @param {Array} intrants - Liste des intrants de la parcelle
 * @param {string} dateRecolteActuelle - Date de la récolte actuelle (YYYY-MM-DD)
 * @param {string|null} dateRecoltePrecedente - Date de la récolte précédente (YYYY-MM-DD) ou null
 * @returns {Array} Liste des intrants filtrés
 */
export const filterIntrantsForHarvest = (
  intrants = [],
  dateRecolteActuelle,
  dateRecoltePrecedente = null
) => {
  if (!Array.isArray(intrants) || !dateRecolteActuelle) return [];

  const dateActuelle = new Date(dateRecolteActuelle).getTime();
  const datePrecedente = dateRecoltePrecedente
    ? new Date(dateRecoltePrecedente).getTime()
    : 0;

  if (isNaN(dateActuelle)) {
    console.warn("Date de récolte actuelle invalide:", dateRecolteActuelle);
    return [];
  }

  return intrants.filter((intrant) => {
    // Récupérer la date d'ajout de l'intrant
    const dateIntrant = intrant.dateAjout
      ? new Date(intrant.dateAjout).getTime()
      : intrant.timestamp
      ? Number(intrant.timestamp)
      : NaN;

    if (!Number.isFinite(dateIntrant)) {
      console.warn("Date d'intrant invalide:", intrant);
      return false;
    }

    // Règle: intrant appliqué APRÈS la récolte précédente ET AVANT/À la récolte actuelle
    const apresRecoltePrecedente = dateIntrant > datePrecedente;
    const avantRecolteActuelle = dateIntrant <= dateActuelle;

    const valide = apresRecoltePrecedente && avantRecolteActuelle;

    return valide;
  });
};

/**
 * Valide si un intrant respecte la règle d'association pour une récolte donnée
 * @param {Object} intrant - L'intrant à valider
 * @param {string} dateRecolteActuelle - Date de la récolte actuelle
 * @param {string|null} dateRecoltePrecedente - Date de la récolte précédente ou null
 * @returns {boolean} true si l'intrant respecte la règle
 */
export const validateIntrantForHarvest = (
  intrant,
  dateRecolteActuelle,
  dateRecoltePrecedente = null
) => {
  if (!intrant || !dateRecolteActuelle) return false;

  const dateIntrant = intrant.dateAjout
    ? new Date(intrant.dateAjout).getTime()
    : intrant.timestamp
    ? Number(intrant.timestamp)
    : NaN;

  if (!Number.isFinite(dateIntrant)) return false;

  const dateActuelle = new Date(dateRecolteActuelle).getTime();
  const datePrecedente = dateRecoltePrecedente
    ? new Date(dateRecoltePrecedente).getTime()
    : 0;

  if (isNaN(dateActuelle)) return false;

  return dateIntrant > datePrecedente && dateIntrant <= dateActuelle;
};

/**
 * Supprime un fichier d'IPFS
 * @param {string} fileId - L'ID du fichier à supprimer
 * @returns {Promise<boolean>} True si supprimé avec succès
 */
export const deleteFromIPFS = async (fileId) => {
  try {
    await myPinataSDK.files.public.delete([fileId]);
    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression IPFS:", error);
    return false;
  }
};

export const deleteFromIPFSByCid = async (_cid) => {
  try {
    // recuperer l'id du fichier a supprimer
    const resId = await myPinataSDK.files.public.list().cid(_cid);
    const id = resId.files[0].id;
    await deleteFromIPFS(id);
    return true;
  } catch (error) {
    console.error(
      "Erreur lors de la supression de fichier sur pinata par cid : ",
      error
    );
    return false;
  }
};

/**
 * Crée un objet de données consolidées pour IPFS
 * @param {Array} items - Tableau d'éléments à consolider
 * @param {string} type - Type de données
 * @returns {Object} Objet consolidé pour IPFS
 */
export const createConsolidatedIPFSData = (items, type) => {
  return {
    type: type,
    items: items,
    timestamp: Date.now(),
    version: "1.0",
  };
};

/**
 * Upload des données consolidées sur IPFS
 * @param {Object} data - Les données à uploader
 * @param {string} type - Le type de données
 * @returns {Promise<Object>} L'objet de réponse IPFS
 */
export const uploadConsolidatedData = async (data, type, _metadata = {}) => {
  try {
    return await apiUploadConsolidatedData(data, type, _metadata);
  } catch (error) {
    console.error("Erreur lors de l'upload des données consolidées:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const uploadLotProduit = async (_data, _account) => {
  try {
    const lotProduitConsolidee = {
      type: "lot-produit",
      id: _data.id,
      nom: _data.nom,
      collecteur: _account,
      certificatsPhytosanitaires: _data.certificatsPhytosanitaires,
      timestamp: Date.now(),
      version: "1.0",
    };

    // 2. Upload des données consolidées sur IPFS
    const lotProduitUpload = await uploadConsolidatedData(
      lotProduitConsolidee,
      "lot-produit"
    );

    return lotProduitUpload;
  } catch (error) {
    console.error("Erreur lors de l'upload du lot de produit : ", error);
    return;
  }
};

/**
 *
 * @param {object} parcelle
 * @param {Array} newData
 * @param {string} _type photos/intrants/inspections
 */
export const updateCidParcelle = async (parcelle, newData, _type) => {
  // 3. Charger l'état consolidé actuel de la parcelle (master), le mettre à jour avec les nouvelles data
  let master = {};
  let keyvalues = {};
  try {
    if (parcelle && parcelle.cid) {
      const resp = await getFileFromPinata(parcelle.cid);
      keyvalues = resp.keyvalues;

      if (resp.data) {
        const json = resp.data;
        master = json && json.items ? json.items : json;
      }
    }
  } catch (error) {
    console.error("Erreur dans updateCidParcelle : ", error);
  }

  // S'assurer qu'on a bien un objet master
  if (!master || typeof master !== "object") {
    master = {};
  }
  const masterMisAJour = {
    ...master,
    type: "parcelle",
    parcelleId: Number(parcelle.id),
    [_type]: newData,
    timestamp: Date.now(),
  };

  // 4. Upload du master consolidé mis à jour (type parcelle)
  const masterUpload = await uploadConsolidatedData(
    masterMisAJour,
    "parcelle",
    keyvalues
  );
  if (!masterUpload.success) {
    throw new Error(
      "Erreur lors de l'upload des données de parcelle consolidées"
    );
  }

  // 5. Mettre à jour le CID de la parcelle avec le nouveau master
  const contract = await getProducteurEnPhaseCultureWrite();
  // pour producteur
  if (_type == "photos") {
    await contract.write("mettreAJourPhotosParcelle", [
      Number(parcelle.id),
      masterUpload.cid,
    ]);
    // pour fournisseur
  } else if (_type === "intrants") {
    await contract.write("mettreAJourPhotosParcelle", [
      Number(parcelle.id),
      masterUpload.cid,
    ]);
    // pour auditeur
  } else if (_type === "inspections") {
    await contract.write("mettreAJourPhotosParcelle", [
      Number(parcelle.id),
      masterUpload.cid,
    ]);
  }

  // supprimer l'ancien fichier associé à la parcelle
  if (parcelle && parcelle.cid) {
    await deleteFromIPFSByCid(parcelle.cid);
  }

  return masterUpload;
};

/**
 * RECUPERATION DES DONNEES DEPUIS PINATA
 */

export const getFileFromPinata = async (_cid) => {
  try {
    return await apiGetFileFromPinata(_cid);
  } catch (error) {
    console.error(
      "Erreur lors de la recuperation de fichier depuis pinata : ",
      error
    );
    return false;
  }
};

export const getMetadataFromPinata = async (_cid) => {
  try {
    const res = await myPinataSDK.files.public.list().cid(_cid);
    return res.files[0];
  } catch (error) {
    console.error(
      "Erreur lors de la recuperation de metadata depuis pinata : ",
      error
    );
    return;
  }
};

/**
 * url pour pouvoir telecharger le fichier depuis pinata
 * @param {string} _cid
 * @returns {string}
 */
export const getUrlDownloadFilePinata = async (_cid) => {
  const res = await myPinataSDK.gateways.public.get(_cid);
  if (res.data instanceof Blob) {
    const blob = new Blob([res.data]);
    return URL.createObjectURL(blob);
  }
  return "";
};

/**
 *
 * @param {string} _cid
 * @param {object} _keyvalues
 * @returns
 */
export const ajouterKeyValuesFileIpfs = async (_cid, _keyvalues) => {
  try {
    const idIpfs = (await myPinataSDK.files.public.list().cid(_cid)).files[0]
      .id;

    const update = await myPinataSDK.files.public.update({
      id: idIpfs,
      keyvalues: _keyvalues,
    });
    return update;
  } catch (error) {
    console.error("Ajout keyvalues sur ipfs : ", error);
    throw new Error("Erreur ajout keyvalues : ", error);
  }
};
