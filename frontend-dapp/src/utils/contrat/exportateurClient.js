import {
  getCommandeProduit,
  getConditionTransportCE,
  getLotProduitEnrichi,
} from "../collecteurExporatateur";
import {
  getCollecteurExportateurContract,
  getExportateurClientContract,
} from "../contract";
import { ajouterKeyValuesFileIpfs, deleteFromIPFSByCid, getFileFromPinata } from "../ipfsUtils";
import { createMerkleTree, getMerkleRoot } from "../merkleUtils";
import { getConditionTransportPC, getRecolte } from "./collecteurProducteur";
import { getActeur } from "./gestionnaireActeurs";
import { getParcelle } from "./producteur";

const collecteurExportateur = await getCollecteurExportateurContract();

/**
 *
 * @param {Array} _idCommandeProduits commandes produits que forme l'article
 * @param {number} _prix
 * @param {string} _cid pour stocker les data sup de l'article
 */
export const ajouterExpedition = async (_idCommandeProduits, _prix, _cid) => {
  // CALCULER LE ROOT MERKLE A L'ARTICLE.
  const allHash = await getAllHashMerkle(_idCommandeProduits);
  const tree = createMerkleTree(allHash);
  const merkleRoot = getMerkleRoot(tree);

  const exportateurClient = await getExportateurClientContract();
  try {
    const res = await exportateurClient.ajouterExpedition(
      _idCommandeProduits,
      _prix,
      _cid,
      merkleRoot
    );
    await res.wait();

    // ajouter hash transaction aux keyvalues du fichier sur ipfs
    await ajouterKeyValuesFileIpfs(_cid, { hashTransaction: res.hash });
    
    return res;
  } catch (error) {
    console.error("Creation d'une article : ", error);

    // supprimer le fichier ipfs si erreur
    if (_cid !== '') deleteFromIPFSByCid(_cid);
  
    throw new Error("Creation article.");
  }
};

/**
 * Recupere tous les hashs feuilles d'une expedition
 * @param {Array} _idCommandeProduits ids des commandes de lot produits
 * @returns {Array}
 */
export const getAllHashMerkle = async (_idCommandeProduits) => {
  // recuper le hashMerkle des du condition de transport : collecteur -> exportateur
  let hashTransportCE = [];
  for (let id of _idCommandeProduits) {
    try {
      const conditions = await getConditionTransportCE(id);
      if (conditions.id && conditions.id !== 0n)
        hashTransportCE.push(conditions.hashTransaction?.toString());
    } catch (error) {
      console.error(
        "Recuperation des hashs de conditions de transport CE: ",
        error
      );
      return;
    }
  }
  // recuperer les hashMerkles des lot de produits (collecteur)
  let hashLotProduits = [];
  let idCommandeRecoltes = [];
  let idRecoltes = [];
  for (let id of _idCommandeProduits) {
    try {
      const commande = await collecteurExportateur.getCommande(id);
      const lotProduit = await getLotProduitEnrichi(
        commande.idLotProduit
      );
      idCommandeRecoltes.push(...lotProduit.idCommandeRecoltes);
      idRecoltes.push(...lotProduit.idRecolte);
      hashLotProduits.push(lotProduit.hashTransaction?.toString());
    } catch (error) {
      console.error("Recuperation des hashs des lot produits : ", error);
      return;
    }
  }
  // recuperer les hashMerkles des conditions de transport recolte : producteur -> collecteur
  let hashTransportPC = [];
  for (let id of idCommandeRecoltes) {
    try {
      const conditions = await getConditionTransportPC(Number(id));
      if (conditions.id && conditions.id !== 0n)
        hashTransportPC.push(conditions.hashTransaction?.toString());
    } catch (error) {
      console.error("Recuperation hash transport PC : ", error);
      return;
    }
  }
  // recuperer hashMerkles recoltes
  let hashRecoltes = [];
  let idParcelles = [];
  for (let id of idRecoltes) {
    try {
      const recolte = await getRecolte(id);
      hashRecoltes.push(recolte.hashTransaction?.toString());
      idParcelles.push(...recolte.idParcelle);
    } catch (error) {
      console.error("Recuperation hashs recoltes : ", error);
      return;
    }
  }
  // recuperer hashMerkles parcelles
  let hashParcelles = [];
  for (let id of idParcelles) {
    try {
      const parcelle = await getParcelle(id);
      hashParcelles.push(parcelle.hashTransaction?.toString());
    } catch (error) {
      console.error("Recuperation hashs parcelles : ", error);
      return;
    }
  }

  // supprimer les doublants
  hashTransportCE = [...new Set(hashTransportCE)];
  hashLotProduits = [...new Set(hashLotProduits)];
  hashTransportPC = [...new Set(hashTransportPC)];
  hashRecoltes = [...new Set(hashRecoltes)];
  hashParcelles = [...new Set(hashParcelles)];

  return [
    ...hashTransportCE,
    ...hashLotProduits,
    ...hashTransportPC,
    ...hashRecoltes,
    ...hashParcelles,
  ];
};

/**
 *
 * @param {string} _ref
 * @returns {object}
 */
export const getDetailsExpeditionByRef = async (_ref) => {
  const contrat = await getExportateurClientContract();
  // recuperer info on-chain
  const expeditionOnChain = await contrat.getExpeditionByReference(_ref);

  // convertir en array
  const idCommandeProduit = Object.values(expeditionOnChain.idCommandeProduit);

  let expeditionComplet = {
    id: expeditionOnChain.id,
    ref: expeditionOnChain.ref,
    idCommandeProduit: idCommandeProduit.map((el) => Number(el)),
    quantite: Number(expeditionOnChain.quantite),
    prix: Number(expeditionOnChain.prix),
    exportateur: await getActeur(expeditionOnChain.exportateur),
    cid: expeditionOnChain.cid,
    rootMerkle: expeditionOnChain.rootMerkle,
    certifier: expeditionOnChain.certifier,
    cidCertificat: expeditionOnChain.cidCertificat,
  };
  // recuperer info off-chain
  const expeditionIpfs = await getFileFromPinata(expeditionComplet.cid);
  expeditionComplet = {
    ...expeditionComplet,
    ...expeditionIpfs.data.items,
    ...expeditionIpfs?.keyvalues,
  };
  return expeditionComplet;
};

/**
 *
 * @param {object} _expedition
 * @returns {object}
 */
export const getParcellesExpedition = async (_expedition) => {
  // recuperer les ids recolte
  let idRecoltes = [];
  for (let id of _expedition.idCommandeProduit) {
    try {
      const commande = await getCommandeProduit(id);
      const lotProduit = await getLotProduitEnrichi(commande.idLotProduit);
      idRecoltes.push(...lotProduit.idRecolte);
    } catch (error) {
      console.error("Recuperation des ids des lot produits : ", error);
      return;
    }
  }
  // recuperer les ids parcelles
  let idParcelles = [];
  for (let id of idRecoltes) {
    try {
      const recolte = await getRecolte(id);
      idParcelles.push(...recolte.idParcelle);
    } catch (error) {
      console.error("Recuperation ids recoltes : ", error);
      return;
    }
  }

  // SUPPRIMER LES DOUBLANTS
  idParcelles = [...new Set(idParcelles)];

  // recuperer les parcelles
  let parcelles = [];
  for (let id of idParcelles) {
    const parcelle = await getParcelle(id);
    parcelles.push(parcelle);
  }

  return parcelles;
};

/**
 *
 * @param {object} _expedition
 * @returns {object}
 */
export const getRecoltesExpedition = async (_expedition) => {
  // recuperer les ids recolte
  let idRecoltes = [];
  for (let id of _expedition.idCommandeProduit) {
    try {
      const commande = await getCommandeProduit(id);
      const lotProduit = await getLotProduitEnrichi(commande.idLotProduit);
      idRecoltes.push(...lotProduit.idRecolte);
    } catch (error) {
      console.error("Recuperation des ids des lot produits : ", error);
      return;
    }
  }

  // SUPPRIMER LES DOUBLANTS
  idRecoltes = [...new Set(idRecoltes)];

  // recuperer les recoltes
  let recoltes = [];
  for (let id of idRecoltes) {
    const recolte = await getRecolte(id);
    recoltes.push(recolte);
  }

  return recoltes;
};

/**
 *
 * @param {object} _expedition
 * @returns {object}
 */
export const getLotProduisExpedition = async (_expedition) => {
  // recuperer les ids des lot de produits (collecteur)
  let idLotProduits = [];
  for (let id of _expedition.idCommandeProduit) {
    try {
      const commande = await collecteurExportateur.getCommande(id);
      idLotProduits.push(commande.idLotProduit);
    } catch (error) {
      console.error("Recuperation des ids des lot produits : ", error);
      return;
    }
  }

  // suprimmer les doublants
  idLotProduits = [...new Set(idLotProduits)];

  // recuperer les lot produits
  let lotProduits = [];
  for (let id of idLotProduits) {
    const lotProduit = await getLotProduitEnrichi(id);
    lotProduits.push(lotProduit);
  }

  return lotProduits;
};

/**
 *
 * @param {object} _expedition
 * @returns {object}
 */
export const getConditionsTransportExpedition = async (_expedition) => {
  let conditions = [];
  let idCommandeRecoltes = [];
  // recuperer les conditions transport CE
  for (let id of _expedition.idCommandeProduit) {
    const condition = await getConditionTransportCE(id);
    if (condition.cid && condition.cid !== "")
      conditions.push(condition);
    // recuperer les ids des commandes recoltes
    try {
      const commande = await collecteurExportateur.getCommande(id);
      const lotProduit = await collecteurExportateur.getLotProduit(
        commande.idLotProduit
      );
      idCommandeRecoltes.push(...lotProduit.idCommandeRecoltes);
    } catch (error) {
      console.error("Recuperation des ids des commandes recoltes : ", error);
      return;
    }
  }

  // suprimmer les doublants
  idCommandeRecoltes = [...new Set(idCommandeRecoltes)];
  
  // recuperer les conditions transport PC
  for (let id of idCommandeRecoltes) {
    const condition = await getConditionTransportPC(id);
    if (condition.cid && condition.cid !== "")
      conditions.push(condition);
  }

  return conditions;
};
