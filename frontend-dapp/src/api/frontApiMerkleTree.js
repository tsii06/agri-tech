import axiosReady, { handleErrorAxios } from "./axiosConfig";

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
    handleErrorAxios(error);
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
    handleErrorAxios(error);
  }
}
