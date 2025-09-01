// Importation de la librairie crypto pour le hachage
import { ethers } from "ethers";

/**
 * Fonction utilitaire pour créer un hash SHA256
 * @param {string} data - Les données à hasher
 * @returns {string} Le hash en hexadécimal
 */
export const sha256 = (data) => {
  return ethers.keccak256(ethers.toUtf8Bytes(data));
};

/**
 * Classe représentant un nœud de l'arbre de Merkle
 */
class MerkleNode {
  constructor(hash, left = null, right = null) {
    this.hash = hash;
    this.left = left;
    this.right = right;
  }
}

/**
 * Crée un arbre de Merkle à partir d'un tableau de hashes
 * @param {string[]} hashes - Tableau de hashes (pair ou impair)
 * @returns {MerkleNode} La racine de l'arbre de Merkle
 */
export const createMerkleTree = (hashes) => {
  if (!hashes || hashes.length === 0) {
    throw new Error("Le tableau de hashes ne peut pas être vide");
  }

  // Créer les nœuds feuilles
  let currentLevel = hashes.map((hash) => new MerkleNode(hash));

  // Construire l'arbre niveau par niveau
  while (currentLevel.length > 1) {
    const nextLevel = [];

    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1];

      if (right) {
        // Pair de nœuds - combiner les deux hashes
        const combinedHash = sha256(left.hash + right.hash);
        nextLevel.push(new MerkleNode(combinedHash, left, right));
      } else {
        // Nombre impair - dupliquer le dernier nœud
        const combinedHash = sha256(left.hash + left.hash);
        nextLevel.push(new MerkleNode(combinedHash, left, left));
      }
    }

    currentLevel = nextLevel;
  }

  return currentLevel[0]; // Retourner la racine
};

/**
 * Récupère la racine de Merkle à partir de l'arbre
 * @param {MerkleNode} root - La racine de l'arbre de Merkle
 * @returns {string} Le hash de la racine
 */
export const getMerkleRoot = (root) => {
  if (!root) {
    throw new Error("L'arbre de Merkle est vide");
  }
  return root.hash;
};

/**
 * Récupère la preuve de Merkle pour un élément donné
 * @param {string[]} hashes - Tableau original des hashes
 * @param {string} targetHash - Le hash pour lequel on veut la preuve
 * @returns {Object} Objet contenant la preuve et l'index de l'élément
 */
export const getMerkleProof = (hashes, targetHash) => {
  const targetIndex = hashes.indexOf(targetHash);

  if (targetIndex === -1) {
    throw new Error("L'élément n'existe pas dans l'arbre");
  }

  const proof = [];
  let currentLevel = [...hashes];
  let currentIndex = targetIndex;

  // Construire la preuve niveau par niveau
  while (currentLevel.length > 1) {
    const nextLevel = [];
    const levelProof = [];

    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] || currentLevel[i]; // Dupliquer si impair

      // Si l'index courant correspond à ce niveau
      if (i === currentIndex || i + 1 === currentIndex) {
        if (currentIndex === i) {
          // L'élément est à gauche, ajouter le frère de droite à la preuve
          levelProof.push({ position: "right", hash: right });
        } else {
          // L'élément est à droite, ajouter le frère de gauche à la preuve
          levelProof.push({ position: "left", hash: left });
        }
      }

      // Calculer le hash combiné pour le niveau suivant
      const combinedHash = sha256(left + right);
      nextLevel.push(combinedHash);
    }

    // Ajouter les preuves de ce niveau
    proof.push(...levelProof);

    // Mettre à jour pour le niveau suivant
    currentLevel = nextLevel;
    currentIndex = Math.floor(currentIndex / 2);
  }

  return {
    index: targetIndex,
    proof: proof,
    root: currentLevel[0],
  };
};

/**
 * Vérifie qu'un élément appartient à l'arbre de Merkle
 * @param {string} targetHash - Le hash à vérifier
 * @param {Array} proof - La preuve de Merkle
 * @param {string} merkleRoot - La racine de l'arbre de Merkle
 * @param {number} index - L'index de l'élément dans le tableau original
 * @returns {boolean} True si l'élément appartient à l'arbre, false sinon
 */
export const verifyMerkleProof = (
  targetHash,
  proof,
  merkleRoot,
  index
) => {
  let currentHash = targetHash;
  let currentIndex = index;

  // Reconstruire le chemin vers la racine en utilisant la preuve
  for (const proofElement of proof) {
    if (proofElement.position === "left") {
      // Le frère est à gauche
      currentHash = sha256(proofElement.hash + currentHash);
    } else {
      // Le frère est à droite
      currentHash = sha256(currentHash + proofElement.hash);
    }
    currentIndex = Math.floor(currentIndex / 2);
  }

  // Vérifier si le hash calculé correspond à la racine
  return currentHash === merkleRoot;
};

/**
 * Fonction utilitaire pour afficher l'arbre de Merkle
 * @param {MerkleNode} node - Nœud à afficher
 * @param {number} depth - Profondeur actuelle
 * @returns {string} Représentation textuelle de l'arbre
 */
export const displayMerkleTree = (node, depth = 0) => {
  if (!node) return "";

  const indent = "  ".repeat(depth);
  let result = `${indent}${node.hash}\n`;

  if (node.left || node.right) {
    if (node.left) {
      result += displayMerkleTree(node.left, depth + 1);
    }
    if (node.right && node.right !== node.left) {
      result += displayMerkleTree(node.right, depth + 1);
    }
  }

  return result;
};

// Exemple d'utilisation
export const exempleUtilisation = () => {
  console.log("=== Exemple d'utilisation de l'arbre de Merkle ===\n");

  // 1. Créer un tableau de hashes de test
  const transactions = ["tx1", "tx2", "tx3", "tx4", "tx5"];
  const hashes = transactions.map((tx) => sha256(tx));

  console.log("Hashes originaux:");
  hashes.forEach((hash, i) => {
    console.log(`${i}: ${hash} (${transactions[i]})`);
  });
  console.log();

  // 2. Créer l'arbre de Merkle
  const merkleTree = createMerkleTree(hashes);
  console.log("Arbre de Merkle créé:");
  console.log(displayMerkleTree(merkleTree));

  // 3. Récupérer la racine
  const root = getMerkleRoot(merkleTree);
  console.log(`Racine de Merkle: ${root}\n`);

  // 4. Obtenir une preuve pour un élément
  const targetHash = hashes[2]; // tx3
  const merkleProof = getMerkleProof(hashes, targetHash);

  console.log(
    `Preuve pour l'élément "${transactions[2]}" (index ${merkleProof.index}):`
  );
  console.log("Preuve:", merkleProof.proof);
  console.log();

  // 5. Vérifier la preuve
  const isValid = verifyMerkleProof(
    targetHash,
    merkleProof.proof,
    root,
    merkleProof.index
  );

  console.log(`Vérification de la preuve: ${isValid ? "VALIDE" : "INVALIDE"}`);

  // 6. Test avec une preuve invalide
  const fakeHash = sha256("fake_transaction");
  const isInvalid = verifyMerkleProof(
    fakeHash,
    merkleProof.proof,
    root,
    merkleProof.index
  );

  console.log(
    `Test avec un faux hash: ${
      isInvalid ? "VALIDE" : "INVALIDE (comme attendu)"
    }`
  );
};

// Fonctions utilitaires supplémentaires

/**
 * Crée un arbre de Merkle à partir de données brutes (les hashe automatiquement)
 * @param {string[]} data - Tableau de données à hasher
 * @returns {Object} Objet contenant l'arbre, les hashes et la racine
 */
export const createMerkleTreeFromData = (data) => {
  const hashes = data.map((item) => sha256(item));
  const tree = createMerkleTree(hashes);

  return {
    tree: tree,
    hashes: hashes,
    root: getMerkleRoot(tree),
    originalData: data,
  };
};

/**
 * Vérifie l'intégrité complète d'un arbre de Merkle
 * @param {string[]} hashes - Hashes originaux
 * @param {string} expectedRoot - Racine attendue
 * @returns {boolean} True si l'arbre est intègre
 */
export const verifyTreeIntegrity = (hashes, expectedRoot) => {
  try {
    const tree = createMerkleTree(hashes);
    const calculatedRoot = getMerkleRoot(tree);
    return calculatedRoot === expectedRoot;
  } catch (error) {
    return false;
  }
};
