import { ethers } from "ethers";

/**
 * Calcule le hash Merkle d'un ensemble de données
 * @param {Array} data - Tableau de données à hasher
 * @returns {string} Le hash Merkle racine
 */
export const calculateMerkleRoot = (data) => {
  if (!data || data.length === 0) {
    return ethers.keccak256(ethers.toUtf8Bytes(""));
  }

  if (data.length === 1) {
    return ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(data[0])));
  }

  // Créer les feuilles (hash des données individuelles)
  const leaves = data.map(item => 
    ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(item)))
  );

  // Construire l'arbre de Merkle
  let currentLevel = leaves;
  
  while (currentLevel.length > 1) {
    const nextLevel = [];
    
    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        // Concaténer et hasher deux éléments
        const combined = currentLevel[i] + currentLevel[i + 1].slice(2);
        nextLevel.push(ethers.keccak256(combined));
      } else {
        // Élément impair, le garder tel quel
        nextLevel.push(currentLevel[i]);
      }
    }
    
    currentLevel = nextLevel;
  }

  return currentLevel[0];
};

/**
 * Calcule le hash Merkle d'une parcelle avec ses composants
 * @param {Object} parcelle - L'objet parcelle
 * @param {Array} photos - Les photos de la parcelle
 * @param {Array} intrants - Les intrants de la parcelle
 * @param {Array} inspections - Les inspections de la parcelle
 * @returns {string} Le hash Merkle de la parcelle
 */
export const calculateParcelleMerkleHash = (parcelle, photos = [], intrants = [], inspections = []) => {
  const parcelleData = {
    id: parcelle.id,
    producteur: parcelle.producteur,
    cid: parcelle.cid,
    photos: photos.map(photo => ({
      cid: photo.cid,
      timestamp: photo.timestamp
    })),
    intrants: intrants.map(intrant => ({
      cid: intrant.cid,
      nom: intrant.nom,
      categorie: intrant.categorie,
      quantite: intrant.quantite,
      fournisseur: intrant.fournisseur
    })),
    inspections: inspections.map(inspection => ({
      cid: inspection.cid,
      auditeur: inspection.auditeur,
      timestamp: inspection.timestamp
    }))
  };

  return calculateMerkleRoot([parcelleData]);
};

/**
 * Calcule le hash Merkle d'une récolte
 * @param {Object} recolte - L'objet récolte
 * @param {Array} parcelles - Les parcelles associées
 * @returns {string} Le hash Merkle de la récolte
 */
export const calculateRecolteMerkleHash = (recolte, parcelles = []) => {
  const recolteData = {
    id: recolte.id,
    idParcelles: recolte.idParcelle,
    quantite: recolte.quantite,
    prixUnit: recolte.prixUnit,
    certifie: recolte.certifie,
    certificatPhytosanitaire: recolte.certificatPhytosanitaire,
    producteur: recolte.producteur,
    cid: recolte.cid,
    parcelles: parcelles.map(parcelle => ({
      id: parcelle.id,
      hashMerkle: parcelle.hashMerkle
    }))
  };

  return calculateMerkleRoot([recolteData]);
};

/**
 * Calcule le hash Merkle d'un lot de produits
 * @param {Object} lotProduit - L'objet lot de produits
 * @param {Array} recoltes - Les récoltes associées
 * @returns {string} Le hash Merkle du lot de produits
 */
export const calculateLotProduitMerkleHash = (lotProduit, recoltes = []) => {
  const lotProduitData = {
    id: lotProduit.id,
    idRecoltes: lotProduit.idRecolte,
    quantite: lotProduit.quantite,
    prix: lotProduit.prix,
    collecteur: lotProduit.collecteur,
    cid: lotProduit.cid,
    recoltes: recoltes.map(recolte => ({
      id: recolte.id,
      hashMerkle: recolte.hashMerkle
    }))
  };

  return calculateMerkleRoot([lotProduitData]);
};

/**
 * Calcule le hash Merkle d'une commande
 * @param {Object} commande - L'objet commande
 * @param {Object} produit - Le produit associé
 * @returns {string} Le hash Merkle de la commande
 */
export const calculateCommandeMerkleHash = (commande, produit = null) => {
  const commandeData = {
    id: commande.id,
    idProduit: commande.idRecolte || commande.idLotProduit,
    quantite: commande.quantite,
    prix: commande.prix,
    payer: commande.payer,
    statutTransport: commande.statutTransport,
    statutProduit: commande.statutRecolte || commande.statutProduit,
    producteur: commande.producteur,
    collecteur: commande.collecteur,
    exportateur: commande.exportateur,
    produit: produit ? {
      id: produit.id,
      hashMerkle: produit.hashMerkle
    } : null
  };

  return calculateMerkleRoot([commandeData]);
};

/**
 * Calcule le hash Merkle d'un paiement
 * @param {Object} paiement - L'objet paiement
 * @returns {string} Le hash Merkle du paiement
 */
export const calculatePaiementMerkleHash = (paiement) => {
  const paiementData = {
    id: paiement.id,
    payeur: paiement.payeur,
    vendeur: paiement.vendeur,
    montant: paiement.montant,
    mode: paiement.mode,
    timestamp: paiement.timestamp
  };

  return calculateMerkleRoot([paiementData]);
};

/**
 * Calcule le hash Merkle d'un intrant
 * @param {Object} intrant - L'objet intrant
 * @returns {string} Le hash Merkle de l'intrant
 */
export const calculateIntrantMerkleHash = (intrant) => {
  const intrantData = {
    nom: intrant.nom,
    quantite: intrant.quantite,
    valide: intrant.valide,
    id: intrant.id,
    categorie: intrant.categorie,
    fournisseur: intrant.fournisseur,
    certificatPhytosanitaire: intrant.certificatPhytosanitaire,
    cid: intrant.cid
  };

  return calculateMerkleRoot([intrantData]);
};

/**
 * Calcule le hash Merkle d'une inspection
 * @param {Object} inspection - L'objet inspection
 * @returns {string} Le hash Merkle de l'inspection
 */
export const calculateInspectionMerkleHash = (inspection) => {
  const inspectionData = {
    id: inspection.id,
    auditeur: inspection.auditeur,
    cid: inspection.cid,
    timestamp: inspection.timestamp
  };

  return calculateMerkleRoot([inspectionData]);
};

/**
 * Calcule le hash Merkle d'un enregistrement de condition
 * @param {Object} condition - L'objet condition
 * @returns {string} Le hash Merkle de la condition
 */
export const calculateConditionMerkleHash = (condition) => {
  const conditionData = {
    id: condition.id,
    cid: condition.cid,
    timestamp: condition.timestamp
  };

  return calculateMerkleRoot([conditionData]);
};

/**
 * Vérifie l'intégrité d'une chaîne de traçabilité
 * @param {Array} chain - La chaîne d'éléments à vérifier
 * @returns {boolean} True si la chaîne est intègre
 */
export const verifyTraceabilityChain = (chain) => {
  if (chain.length < 2) return true;

  for (let i = 1; i < chain.length; i++) {
    const current = chain[i];
    const previous = chain[i - 1];
    
    // Vérifier que le hash Merkle précédent est référencé
    if (current.hashMerkle && !current.hashMerkle.includes(previous.hashMerkle)) {
      return false;
    }
  }

  return true;
};

/**
 * Génère un hash Merkle pour un ensemble de données spécifiques
 * @param {string} type - Le type de données
 * @param {Array} data - Les données à hasher
 * @returns {string} Le hash Merkle
 */
export const generateTypeSpecificMerkleHash = (type, data) => {
  const typeData = {
    type: type,
    data: data,
    timestamp: Date.now()
  };

  return calculateMerkleRoot([typeData]);
};
