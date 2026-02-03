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
