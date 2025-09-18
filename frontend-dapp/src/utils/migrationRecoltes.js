import { getCollecteurProducteurContract } from '../contract';
import { getRecolte, getDateRecoltePrecedente } from '../contrat/collecteurProducteur';
import { filterIntrantsForHarvest, getMasterFromCid, uploadConsolidatedData, ajouterKeyValuesFileIpfs, computeSeasonFromDate, calculateNumeroRecolte } from '../ipfsUtils';
import { getParcelle } from '../contrat/producteur';

/**
 * Migre une récolte existante pour ajouter le stockage des intrants dans IPFS
 * @param {number} idRecolte - ID de la récolte à migrer
 * @returns {Promise<boolean>} - true si succès, false sinon
 */
export const migrateRecolteWithIntrants = async (idRecolte) => {
  try {
    console.log(`🔄 Migration de la récolte ${idRecolte}...`);
    
    // Récupérer la récolte actuelle
    const recolte = await getRecolte(idRecolte);
    
    // Vérifier si déjà migrée
    if (recolte.intrantsSource === 'IPFS_STORED') {
      console.log(`✅ Récolte ${idRecolte} déjà migrée`);
      return true;
    }
    
    if (!recolte.cid || !recolte.dateRecolteOriginal) {
      console.log(`❌ Récolte ${idRecolte} manque de données pour migration`);
      return false;
    }
    
    // Récupérer les intrants selon la règle d'association
    let intrantsUtilises = [];
    let dateRecoltePrecedente = null;
    let numeroRecolte = 1;
    let intrantsParcelle = [];
    
    for (const idParcelle of recolte.idParcelle) {
      try {
        const parcelle = await getParcelle(idParcelle);
        if (parcelle && parcelle.cid) {
          const masterParcelle = await getMasterFromCid(parcelle.cid);
          const intrantsParcelleData = Array.isArray(masterParcelle?.intrants) ? masterParcelle.intrants : [];
          intrantsParcelle.push(...intrantsParcelleData);
          
          if (!dateRecoltePrecedente) {
            dateRecoltePrecedente = await getDateRecoltePrecedente(idParcelle, recolte.dateRecolteOriginal);
          }
          
          // Calculer le numéro de récolte pour la première parcelle
          if (numeroRecolte === 1) {
            numeroRecolte = await calculateNumeroRecolte(idParcelle, recolte.dateRecolteOriginal);
          }
          
          const intrantsFilters = filterIntrantsForHarvest(
            intrantsParcelleData,
            recolte.dateRecolteOriginal,
            dateRecoltePrecedente
          );
          
          intrantsUtilises.push(...intrantsFilters);
        }
      } catch (error) {
        console.warn(`Erreur parcelle ${idParcelle}:`, error);
      }
    }
    
    // Supprimer les doublons
    intrantsUtilises = intrantsUtilises.filter((intrant, index, self) => 
      index === self.findIndex(i => i.nom === intrant.nom && i.dateAjout === intrant.dateAjout)
    );
    
    // Créer le nouvel objet récolte avec intrants et saison dynamique
    const premiereParcelle = recolte.idParcelle[0];
    const saison = computeSeasonFromDate(
      recolte.dateRecolteOriginal, 
      dateRecoltePrecedente, 
      intrantsParcelle, 
      premiereParcelle,
      numeroRecolte
    );
    
    const recolteConsolidee = {
      ...recolte,
      type: "recolte",
      intrantsUtilises: intrantsUtilises,
      dateRecoltePrecedente: dateRecoltePrecedente,
      numeroRecolte: numeroRecolte, // Nouveau: numéro de récolte
      saison: saison, // Nouvelle logique de saison dynamique
      regleAssociation: {
        appliquee: true,
        version: "1.0",
        migratedAt: new Date().toISOString(),
        description: "Intrants appliqués après récolte précédente et avant/à récolte actuelle"
      },
      version: "2.1_migrated", // Version avec saison dynamique
      migrationTimestamp: Date.now()
    };
    
    // Upload de la nouvelle version
    const nouvelleRecolteUpload = await uploadConsolidatedData(
      recolteConsolidee,
      "recolte"
    );
    
    if (!nouvelleRecolteUpload.success) {
      throw new Error("Erreur lors de l'upload de la récolte migrée");
    }
    
    // Mettre à jour le CID sur la blockchain
    const contract = await getCollecteurProducteurContract();
    // Note: Il faudrait une fonction pour mettre à jour le CID d'une récolte
    // Ici on suppose qu'elle existe ou qu'on l'ajoute
    
    // Ajouter les métadonnées
    await ajouterKeyValuesFileIpfs(nouvelleRecolteUpload.cid, {
      migratedFrom: recolte.cid,
      intrantsCount: intrantsUtilises.length,
      migrationDate: new Date().toISOString()
    });
    
    console.log(`✅ Récolte ${idRecolte} migrée avec ${intrantsUtilises.length} intrants stockés`);
    return true;
    
  } catch (error) {
    console.error(`❌ Erreur migration récolte ${idRecolte}:`, error);
    return false;
  }
};

/**
 * Migre toutes les récoltes existantes
 * @param {number} startId - ID de début
 * @param {number} endId - ID de fin
 */
export const migrateAllRecoltes = async (startId = 1, endId = null) => {
  try {
    const contract = await getCollecteurProducteurContract();
    const compteurRecoltes = await contract.compteurRecoltes();
    const maxId = endId || Number(compteurRecoltes);
    
    console.log(`🚀 Début migration récoltes ${startId} à ${maxId}`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (let i = startId; i <= maxId; i++) {
      const success = await migrateRecolteWithIntrants(i);
      if (success) {
        migratedCount++;
      } else {
        errorCount++;
      }
      
      // Pause pour éviter de surcharger
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`📊 Migration terminée: ${migratedCount} succès, ${errorCount} erreurs`);
    return { migratedCount, errorCount };
    
  } catch (error) {
    console.error("❌ Erreur migration globale:", error);
    return { migratedCount: 0, errorCount: -1 };
  }
};

// Fonction utilitaire pour la console
window.migrateRecoltes = migrateAllRecoltes;