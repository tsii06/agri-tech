import { uploadConsolidatedData } from "../ipfsUtils";

/**
 *
 * @param {string} _nomProduit
 * @param {Date} _dateExpedition
 * @param {string} _lieuDepart
 * @param {string} _destination
 * @param {string} _typeTransport
 */
export const uploadExpedition = async (
  _nomProduit,
  _dateExpedition,
  _lieuDepart,
  _destination,
  _typeTransport
) => {
  try {
    const expeditionConsolidee = {
      type: "expedition",
      nomProduit: _nomProduit,
      dateExpedition: _dateExpedition,
      lieuDepart: _lieuDepart,
      destination: _destination,
      typeTransport: _typeTransport,
      timestamp: Date.now(),
      version: "1.0",
    };
    const articleUpload = await uploadConsolidatedData(
      expeditionConsolidee,
      "expedition"
    );
    return articleUpload;
  } catch (error) {
    console.error("Upload expedition : ", error);
    return;
  }
};
