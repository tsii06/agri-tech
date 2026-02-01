import { apiCreateMerkleTree, apiGetStructureMerkle } from "../api/merkleTree";


/**
 * Crée un arbre de Merkle à partir d'un tableau de data
 * @param {Array<Object>} _dataArray - Tableau de data
 * @returns {Object} contenant les infos utiles a l'arbre de merkle.
 */
export const createMerkleTree = async (_dataArray) => {
  const tree = await apiCreateMerkleTree(_dataArray);
  console.log("||||||||| Arbre de merkle recuperer depuis watcher : ", tree);
  return tree.data;
};

/**
 * Crée un arbre de Merkle à partir d'un tableau de data
 * @param {Array<Object>} _dataArray - Tableau de data
 * @returns {Object} contenant les infos utiles a l'arbre de merkle.
 */
export const getStructureMerkleTree = async (_dataArray) => {
  const res = await apiGetStructureMerkle(_dataArray);
  console.log("||||||| Structure merkle tree depuis watcher : ", res.data);
  return res.data;
};
