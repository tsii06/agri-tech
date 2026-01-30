import axiosReady from "./axiosConfig";

export const apiGetAnchorExpedition = async (_ref) => {
  try {
    const res = await axiosReady.get(`/anchor-expedition/${_ref}`);
    return res;
  } catch (error) {
    console.error(
      "Erreur recuperation anchorExpedition depuis watcher : ",
      error
    );
    throw new Error("Erreur recuperation anchorExpedition.");
  }
};
