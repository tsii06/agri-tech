import { uploadConsolidatedData } from "../ipfsUtils";

/**
 *
 * @param {string} _nomProduit
 * @param {Date} _dateExpedition
 * @param {string} _lieuDepart
 * @param {string} _destination
 * @param {string} _typeTransport
 */
export const uploadArticle = async (
  _nomProduit,
  _dateExpedition,
  _lieuDepart,
  _destination,
  _typeTransport
) => {
  try {
    const articleConsolidee = {
      type: "article",
      nomProduit: _nomProduit,
      dateExpedition: _dateExpedition,
      lieuDepart: _lieuDepart,
      destination: _destination,
      typeTransport: _typeTransport,
      timestamp: Date.now(),
      version: "1.0",
    };
    const articleUpload = await uploadConsolidatedData(
      articleConsolidee,
      "article"
    );
    return articleUpload;
  } catch (error) {
    console.error("Upload article : ", error);
    return;
  }
};
