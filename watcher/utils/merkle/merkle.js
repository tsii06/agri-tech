import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

/**
 * Crée un arbre de Merkle à partir d'une liste de données
 * @param {Array} data - Liste des données à inclure dans l'arbre
 * @param {string} hashAlgorithm - Algorithme de hachage ('keccak256' par défaut)
 * @returns {Object} Objet contenant l'arbre et ses propriétés
 */
export const createMerkleTree = (data, hashAlgorithm = "keccak256") => {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Les données doivent être un tableau non vide");
  }

  // Hacher les données d'entrée
  const hashedData = data.map((item) => {
    const stringified = typeof item === "string" ? item : JSON.stringify(item);
    return keccak256(stringified);
  });

  // Créer l'arbre de Merkle
  const tree = new MerkleTree(hashedData, keccak256, {
    sortPairs: true,
    hashAlgorithm: hashAlgorithm,
  });

  return {
    tree: tree,
    root: tree.getRoot(),
    rootHex: "0x" + tree.getRoot().toString("hex"),
    leaves: hashedData,
    leavesHex: hashedData.map((leaf) => "0x" + leaf.toString("hex")),
  };
};

/**
 * Génère une preuve de Merkle pour un élément spécifique
 * @param {Object} merkleData - Objet retourné par createMerkleTree
 * @param {Buffer|string} leaf - La feuille pour laquelle générer la preuve
 * @returns {Array} Tableau de la preuve de Merkle
 */
export const getMerkleProof = (merkleData, leaf) => {
  const { tree } = merkleData;

  // Convertir la feuille en Buffer si c'est une chaîne
  let leafBuffer = leaf;
  if (typeof leaf === "string") {
    leafBuffer = keccak256(leaf);
  }

  const proof = tree.getProof(leafBuffer);
  return proof.map((node) => ({
    data: "0x" + node.data.toString("hex"),
    position: node.position,
  }));
};

/**
 * Vérifie qu'une preuve de Merkle est valide pour un élément
 * @param {Object} merkleData - Objet retourné par createMerkleTree
 * @param {Array} proof - Tableau de la preuve de Merkle
 * @param {Buffer|string} leaf - La feuille à vérifier
 * @returns {boolean} True si la preuve est valide
 */
export const verifyMerkleProof = (merkleData, proof, leaf) => {
  const { tree } = merkleData;

  // Convertir la feuille en Buffer si c'est une chaîne
  let leafBuffer = leaf;
  if (typeof leaf === "string") {
    leafBuffer = keccak256(leaf);
  }

  // Convertir la preuve au format attendu par merkletreejs
  const proofBuffers = proof.map((p) => {
    if (typeof p === "string") {
      return Buffer.from(p.replace("0x", ""), "hex");
    }
    return Buffer.from(p.data.replace("0x", ""), "hex");
  });

  return tree.verify(proofBuffers, leafBuffer, tree.getRoot());
};

/**
 * Crée un arbre de Merkle et retourne tous les détails avec les preuves
 * @param {Array} data - Liste des données
 * @returns {Object} Objet contenant l'arbre complet avec preuves pour chaque feuille
 */
export const createMerkleTreeWithProofs = (data) => {
  const merkleData = createMerkleTree(data);
  const { tree, leavesHex } = merkleData;

  const proofs = leavesHex.map((leafHex, index) => {
    const leafBuffer = Buffer.from(leafHex.replace("0x", ""), "hex");
    const proof = tree.getProof(leafBuffer);
    return {
      leafIndex: index,
      leaf: leafHex,
      proof: proof.map((node) => ({
        data: "0x" + node.data.toString("hex"),
        position: node.position,
      })),
    };
  });

  return {
    root: merkleData.rootHex,
    rootBuffer: merkleData.root,
    leaves: leavesHex,
    proofs,
    originalData: data,
  };
};

/**
 * Hache une donnée individuelle avec Keccak256
 * @param {string|Object} data - La donnée à hacher
 * @returns {string} Hash hexadécimal (avec préfixe 0x)
 */
export const hashData = (data) => {
  const stringified = typeof data === "string" ? data : JSON.stringify(data);
  const hash = keccak256(stringified);
  return "0x" + hash.toString("hex");
};

/**
 * Combine deux hashes (utile pour vérifier les nœuds intermédiaires)
 * @param {string|Buffer} hash1 - Premier hash (hex avec 0x ou Buffer)
 * @param {string|Buffer} hash2 - Deuxième hash (hex avec 0x ou Buffer)
 * @returns {string} Hash combiné en hexadécimal (avec préfixe 0x)
 */
export const combineHashes = (hash1, hash2) => {
  let buf1 = hash1;
  let buf2 = hash2;

  if (typeof hash1 === "string") {
    buf1 = Buffer.from(hash1.replace("0x", ""), "hex");
  }
  if (typeof hash2 === "string") {
    buf2 = Buffer.from(hash2.replace("0x", ""), "hex");
  }

  const combined = keccak256(Buffer.concat([buf1, buf2]));
  return "0x" + combined.toString("hex");
};

/**
 * Obtient la hauteur de l'arbre (nombre de niveaux)
 * @param {Object} merkleData - Objet retourné par createMerkleTree
 * @returns {number} Hauteur de l'arbre
 */
export const getTreeHeight = (merkleData) => {
  const { leaves } = merkleData;
  return Math.ceil(Math.log2(leaves.length));
};

/**
 * Obtient la structure complète de l'arbre pour visualisation
 * @param {Object} merkleData - Objet retourné par createMerkleTree
 * @returns {Object} Structure hiérarchique de l'arbre
 */
export const getTreeStructure = (merkleData) => {
  const layers = merkleData.getLayers();
  
  function buildNode(layerIndex, nodeIndex) {
    const layer = layers[layerIndex];
    if (!layer || !layer[nodeIndex]) return null;
    
    const hash = '0x' + layer[nodeIndex].toString('hex');
    
    // Si on est à la dernière couche (feuilles), pas d'enfants
    if (layerIndex === 0) {
      return { hash };
    }
    
    // Sinon, construire les enfants
    const left = buildNode(layerIndex - 1, nodeIndex * 2);
    const right = buildNode(layerIndex - 1, nodeIndex * 2 + 1);
    
    return {
      hash,
      left,
      right
    };
  }

  return {
    // Debuter a la rootMerkle.
    structure: buildNode(layers.length - 1, 0),
    couches: layers
  };
};

/**
 * Valide plusieurs preuves à la fois (batch verification)
 * @param {Object} merkleData - Objet retourné par createMerkleTree
 * @param {Array} verifications - Tableau d'objets {leaf, proof}
 * @returns {Array} Tableau des résultats de vérification
 */
export const batchVerifyProofs = (merkleData, verifications) => {
  return verifications.map(({ leaf, proof }) => ({
    leaf,
    isValid: verifyMerkleProof(merkleData, proof, leaf),
  }));
};
