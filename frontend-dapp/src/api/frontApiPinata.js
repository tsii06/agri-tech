import axiosReady, { handleErrorAxios } from "./axiosConfig";

// Recuperer fichier depuis pinata par cid
export const apiGetFileFromPinata = async (_cid) => {
  try {
    const res = await axiosReady.get(`/api/pinata/get-file/${_cid}`);
    return res.data;
  } catch (error) {
    handleErrorAxios(error);
  }
};

// Upload consolidated data to pinata
export const apiUploadConsolidatedData = async (donnee, type, metadata) => {
  try {
    const response = await axiosReady.post(
      `/api/pinata/upload-consolidated-data`,
      { data: { donnee, type, metadata } },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 secondes max
      }
    );

    return response.data;
  } catch (error) {
    handleErrorAxios(error);
  }
};

// Ajout keyvalues data to pinata
export const apiAjouterKeyvalues = async (cid, keyvalues) => {
  try {
    const response = await axiosReady.post(
      `/api/pinata/ajout-key-values`,
      { data: { cid, keyvalues } },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 secondes max
      }
    );

    return response.data;
  } catch (error) {
    handleErrorAxios(error);
  }
};
