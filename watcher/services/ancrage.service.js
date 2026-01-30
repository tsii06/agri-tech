import { prisma } from "../prisma/client.js";

export const getAncrageByRef = async (_ref) => {
  try {
    const ancrage = await prisma.ancrage.findUnique({
      where: { refExpedition: _ref },
    });
    return ancrage;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'ancrage:", error);
    throw new Error(`Impossible de récupérer l'ancrage pour la référence ${_ref}`);
  }
};

export const createAncrage = async (_txHash, _ref) => {
  try {
    const ancrage = await prisma.ancrage.create({
      data: { txHash: _txHash, refExpedition: _ref },
    });
    return ancrage;
  } catch (error) {
    console.error("Erreur lors de la création de l'ancrage:", error);
    throw new Error(`Impossible de créer l'ancrage pour la référence ${_ref}`);
  }
};
