import express from "express";
import {
  createMerkleTreeWithProofs,
  createMerkleTree,
  getMerkleProof,
  verifyMerkleProof,
  getTreeStructure,
  hashData,
} from "../utils/merkle/merkle.js";

const router = express.Router();

/**
 * POST /api/merkle/create
 * Crée un arbre de Merkle à partir de données fournies
 * @param {Array} data - Tableau des données à inclure dans l'arbre
 */
router.post("/create", (req, res) => {
  try {
    const { data } = req.body;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        error: "Les données doivent être un tableau non vide",
      });
    }

    const merkleData = createMerkleTreeWithProofs(data);

    res.json({
      success: true,
      data: {
        root: merkleData.root,
        leaves: merkleData.leaves,
        proofs: merkleData.proofs,
        leafCount: merkleData.leaves.length,
        treeHeight: Math.ceil(Math.log2(merkleData.leaves.length)),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * GET /api/merkle/example
 * Retourne un exemple d'arbre de Merkle avec données d'exemple
 */
router.get("/example", (req, res) => {
  try {
    const exampleData = [
      "Product_001",
      "Product_002",
      "Product_003",
      "Product_004",
    ];

    const merkleData = createMerkleTreeWithProofs(exampleData);

    res.json({
      success: true,
      data: {
        root: merkleData.root,
        leaves: merkleData.leaves,
        proofs: merkleData.proofs,
        originalData: merkleData.originalData,
        leafCount: merkleData.leaves.length,
        treeHeight: Math.ceil(Math.log2(merkleData.leaves.length)),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * POST /api/merkle/verify
 * Vérifie une preuve de Merkle
 * @param {string} root - La racine de l'arbre
 * @param {string} leaf - La feuille à vérifier
 * @param {Array} proof - La preuve de Merkle
 */
router.post("/verify", (req, res) => {
  try {
    const { data, leaf, proof } = req.body;

    if (!Array.isArray(data) || !leaf || !Array.isArray(proof)) {
      return res.status(400).json({
        error: "Données manquantes: data (array), leaf (string), proof (array)",
      });
    }

    const merkleData = createMerkleTree(data);
    const isValid = verifyMerkleProof(merkleData, proof, leaf);

    res.json({
      success: true,
      data: {
        leaf,
        isValid,
        root: merkleData.rootHex,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * POST /api/merkle/structure
 * Retourne la structure complète de l'arbre (tous les niveaux)
 * @param {Array} data - Tableau des données
 */
router.post("/structure", (req, res) => {
  try {
    const { data } = req.body;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        error: "Les données doivent être un tableau non vide",
      });
    }

    const merkleData = createMerkleTree(data);
    const structure = getTreeStructure(merkleData.tree);
    const { leaves, proofs } = createMerkleTreeWithProofs(data);

    res.json({
      success: true,
      data: {
        rootHex: merkleData.rootHex,
        leaves,
        proofs,
        structure: structure.structure,
        couches: structure.couches
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * POST /api/merkle/hash
 * Hache une donnée individuelle
 * @param {string|Object} data - La donnée à hacher
 */
router.post("/hash", (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({
        error: "Donnée manquante",
      });
    }

    const hash = hashData(data);

    res.json({
      success: true,
      data: {
        input: data,
        hash,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * POST /api/merkle/proof
 * Génère une preuve pour un élément spécifique
 * @param {Array} data - Tableau des données
 * @param {string|number} index - Index de l'élément pour lequel générer la preuve
 */
router.post("/proof", (req, res) => {
  try {
    const { data, index } = req.body;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        error: "Les données doivent être un tableau non vide",
      });
    }

    if (index === undefined || index < 0 || index >= data.length) {
      return res.status(400).json({
        error: `Index invalide: doit être entre 0 et ${data.length - 1}`,
      });
    }

    const merkleData = createMerkleTreeWithProofs(data);
    const proofData = merkleData.proofs[index];

    res.json({
      success: true,
      data: {
        originalData: merkleData.originalData[index],
        leafHash: proofData.leaf,
        leafIndex: proofData.leafIndex,
        proof: proofData.proof,
        root: merkleData.root,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * POST /api/merkle/batch-visualization
 * Retourne toutes les données nécessaires pour une visualisation complète
 * @param {Array} data - Tableau des données
 */
router.post("/batch-visualization", (req, res) => {
  try {
    const { data } = req.body;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        error: "Les données doivent être un tableau non vide",
      });
    }

    const merkleData = createMerkleTreeWithProofs(data);
    const merkleTreeData = createMerkleTree(data);
    const structure = getTreeStructure(merkleTreeData);

    // Construire l'arbre niveau par niveau
    const levels = Object.entries(structure.levels).map(([level, nodes]) => ({
      level: parseInt(level),
      nodes: nodes.map((node) => ({
        hash: "0x" + node.toString("hex"),
        hashShort: ("0x" + node.toString("hex")).substring(0, 10) + "...",
      })),
    }));

    res.json({
      success: true,
      data: {
        summary: {
          root: merkleData.root,
          rootShort: merkleData.root.substring(0, 10) + "...",
          leafCount: merkleData.leaves.length,
          treeHeight: structure.height,
        },
        leaves: merkleData.leaves.map((leaf, index) => ({
          index,
          hash: leaf,
          hashShort: leaf.substring(0, 10) + "...",
          originalData: merkleData.originalData[index],
        })),
        levels,
        proofs: merkleData.proofs.map((proof) => ({
          leafIndex: proof.leafIndex,
          leaf: proof.leaf,
          proof: proof.proof.map((p) => ({
            hash: p.data,
            hashShort: p.data.substring(0, 10) + "...",
            position: p.position,
          })),
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

export default router;
