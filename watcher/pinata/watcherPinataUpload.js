import myPinataSDK from "./watcherSetupPinata.js";

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
 * @param {Object} donnee - Les données à uploader
 * @param {string} type - Le type de données
 * @returns {Promise<Object>} L'objet de réponse IPFS
 */
export const uploadConsolidatedData = async (donnee, type, _metadata = {}) => {
  try {
    const consolidatedData = createConsolidatedIPFSData(donnee, type);
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

    return await uploadToIPFS(file, metadata, type);
  } catch (error) {
    console.error("Erreur lors de l'upload des données consolidées:", error);
    return {
      success: false,
      error: error.message,
    };
  }
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
