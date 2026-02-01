import axiosReady from "./axiosConfig";

/**
 * Crée un arbre de Merkle à partir d'objets complexes
 * @param {Array<Object>} dataArray - Tableau d'objets à hasher
 * @returns {Promise<Object>} Données de l'arbre de Merkle
 */
export async function apiCreateMerkleTree(dataArray) {
  // Validation côté client
  if (!Array.isArray(dataArray)) {
    throw new Error("Les données doivent être un tableau");
  }

  if (dataArray.length === 0) {
    throw new Error("Le tableau ne peut pas être vide");
  }

  try {
    const response = await axiosReady.post(
      `/api/merkle/create`,
      { data: dataArray },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 secondes max
      }
    );

    return response.data;
  } catch (error) {
    // Erreur de validation du serveur (400)
    if (error.response?.status === 400) {
      throw new Error(`Données invalides: ${error.response.data.error}`);
    }

    // Erreur serveur (500)
    if (error.response?.status === 500) {
      throw new Error(`Erreur serveur: ${error.response.data.error}`);
    }

    // Timeout
    if (error.code === "ECONNABORTED") {
      throw new Error("Délai d'attente dépassé");
    }

    // Pas de connexion
    if (error.code === "ERR_NETWORK") {
      throw new Error("Impossible de contacter le serveur");
    }

    // Autre erreur
    throw new Error(`Erreur inconnue: ${error.message}`);
  }
}

/**
 * Crée un arbre de Merkle à partir d'objets complexes
 * @param {Array<Object>} _dataArray - Tableau d'objets à hasher
 * @returns {Promise<Object>} Données de l'arbre de Merkle
 */
export async function apiGetStructureMerkle(_dataArray) {
  // Validation côté client
  if (!Array.isArray(_dataArray)) {
    throw new Error("Les données doivent être un tableau");
  }

  if (_dataArray.length === 0) {
    throw new Error("Le tableau ne peut pas être vide");
  }

  try {
    const response = await axiosReady.post(
      `/api/merkle/structure`,
      { data: _dataArray },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 secondes max
      }
    );

    return response.data;
  } catch (error) {
    // Erreur de validation du serveur (400)
    if (error.response?.status === 400) {
      throw new Error(`Données invalides: ${error.response.data.error}`);
    }

    // Erreur serveur (500)
    if (error.response?.status === 500) {
      throw new Error(`Erreur serveur: ${error.response.data.error}`);
    }

    // Timeout
    if (error.code === "ECONNABORTED") {
      throw new Error("Délai d'attente dépassé");
    }

    // Pas de connexion
    if (error.code === "ERR_NETWORK") {
      throw new Error("Impossible de contacter le serveur");
    }

    // Autre erreur
    throw new Error(`Erreur inconnue: ${error.message}`);
  }
}
