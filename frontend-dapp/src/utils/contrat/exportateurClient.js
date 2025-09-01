import {
  getCollecteurExportateurContract,
  getCollecteurProducteurContract,
  getProducteurContract,
} from "../contract";

/**
 *
 * @param {Array} _idCommandeProduits commandes produits que forme l'article
 * @param {number} _prix
 * @param {string} _cid pour stocker les data sup de l'article
 */
export const ajoutArticle = async (_idCommandeProduits, _prix, _cid) => {
  // CALCULER LE ROOT MERKLE A L'ARTICLE.
  const collecteurExportateur = await getCollecteurExportateurContract();
  const collecteurProducteur = await getCollecteurProducteurContract();
  const producteurContrat = await getProducteurContract();
  // recuper le hashMerkle des du condition de transport : collecteur -> exportateur
  let hashTransportCE = [];
  for (let id of _idCommandeProduits) {
    try {
      const conditions = await collecteurExportateur.getCondition(id);
      hashTransportCE.push(conditions.hashMerkle.toString());
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
      const lotProduit = await collecteurExportateur.getLotProduit(
        commande.idLotProduit
      );
      idCommandeRecoltes.push(...lotProduit.idCommandeRecoltes);
      idRecoltes.push(...lotProduit.idRecolte);
      hashLotProduits.push(lotProduit.hashMerkle.toString());
    } catch (error) {
      console.error("Recuperation des hashs des lot produits : ", error);
      return;
    }
  }
  // recuperer les hashMerkles des conditions de transport recolte : producteur -> collecteur
  let hashTransportPC = [];
  for (let id of idCommandeRecoltes) {
    try {
      const conditions = await collecteurProducteur.getConditionTransport(id);
      hashTransportPC.push(conditions.hashMerkle.toString());
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
      const recolte = await collecteurProducteur.getRecolte(id);
      hashRecoltes.push(recolte.hashMerkle.toString());
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
      const parcelle = await producteurContrat.getParcelle(id);
      hashParcelles.push(parcelle.hashMerkle.toString());
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


  // console.log("hashTransportCE : ", hashTransportCE);
  // console.log("hashLotProduit : ", hashLotProduits);
  // console.log("hashTransportPC : ", hashTransportPC);
  // console.log("hashRecoltes : ", hashRecoltes);
  // console.log("hashParcelles : ", hashParcelles);
};
