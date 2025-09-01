import { getContract } from "./contract";
import myPinataSDK from "./pinata";

/**
 * Upload un fichier sur IPFS avec des métadonnées spécifiques
 * @param {File} file - Le fichier à uploader
 * @param {Object} metadata - Les métadonnées du fichier
 * @returns {Promise<Object>} L'objet de réponse IPFS avec CID
 */
export const uploadToIPFS = async (file, metadata = {}) => {
  try {
    const res = await myPinataSDK.upload.public.file(file).keyvalues(metadata);

    if (res.is_duplicate) {
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
export const uploadJsonToIpfs = async (data, type, metadata={}) => {
  try {
    const res = await myPinataSDK.upload.public
      .json(data)
      .name(`${type}-${Date.now()}.json`)
      .keyvalues(metadata);
    return {...res, success:true};
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
  return await uploadToIPFS(file, metadata);
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
    return await uploadToIPFS(file, metadata);
  else
    return await uploadJsonToIpfs(inspectionData, "inspection", metadata);
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
  return await uploadToIPFS(file, metadata);
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
    dateEmission: certificatData.dateEmission,
    dateExpiration: certificatData.dateExpiration,
    region: certificatData.region,
    autoriteCertificatrice: certificatData.autoriteCertificatrice,
    adresseProducteur: certificatData.adresseProducteur,
    idParcelle: certificatData.idParcelle,
    numeroCertificat: certificatData.numeroCertificat,
    timestamp: Date.now().toString(),
  };
  return await uploadToIPFS(file, metadata);
};

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
    const consolidatedData = createConsolidatedIPFSData(data, type);
    const blob = new Blob([JSON.stringify(consolidatedData)], {
      type: "application/json",
    });
    const file = new File([blob], `${type}-${Date.now()}.json`, {
      type: "application/json",
    });

    const metadata = {
      type: `consolidated-${type}`,
      timestamp: Date.now().toString(),
      ..._metadata,
    };

    return await uploadToIPFS(file, metadata);
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
  try {
    if (parcelle && parcelle.cid) {
      const resp = await fetch(getIPFSURL(parcelle.cid));
      if (resp.ok) {
        const json = await resp.json();
        master = json && json.items ? json.items : json;
      }
    }
  } catch {}

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
  const masterUpload = await uploadConsolidatedData(masterMisAJour, "parcelle");
  if (!masterUpload.success) {
    throw new Error(
      "Erreur lors de l'upload des données de parcelle consolidées"
    );
  }

  // 5. Mettre à jour le CID de la parcelle avec le nouveau master
  const contract = await getContract();
  let tx;
  // pour producteur
  if (_type == "photos") {
    tx = await contract.mettreAJourPhotosParcelle(
      Number(parcelle.id),
      masterUpload.cid
    );
    // pour fournisseur
  } else if (_type === "intrants") {
    tx = await contract.mettreAJourIntrantsParcelle(
      Number(parcelle.id),
      masterUpload.cid
    );
    // pour auditeur
  } else if (_type === "inspections") {
    tx = await contract.mettreAJourInspectionsParcelle(
      Number(parcelle.id),
      masterUpload.cid
    );
  }
  await tx.wait();

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
    const res = await myPinataSDK.gateways.public.get(_cid);
    return res;
  } catch (error) {
    console.error(
      "Erreur lors de la recuperation de fichier depuis pinata : ",
      error
    );
    return;
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
