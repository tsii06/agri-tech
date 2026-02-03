import myPinataSDK from "./watcherSetupPinata.js";

// Recuperation de fichier by cid
export const getFileFromPinata = async (_cid) => {
  try {
    const res = await myPinataSDK.gateways.public.get(_cid);
    const metadata = (await myPinataSDK.files.public.list().cid(_cid)).files[0]
      ?.keyvalues;

    return { ...res, keyvalues: metadata };
  } catch (error) {
    console.error(
      "Erreur lors de la recuperation de fichier depuis pinata : ",
      error
    );
    return false;
  }
};