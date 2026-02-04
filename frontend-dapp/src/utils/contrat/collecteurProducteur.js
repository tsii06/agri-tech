import { ethers } from "ethers";
import { DEBUT_RECOLTE, getCollecteurProducteurContract } from "../contract";
import {
  ajouterKeyValuesFileIpfs,
  deleteFromIPFSByCid,
  getFileFromPinata,
  uploadConsolidatedData,
  computeSeasonFromDate,
  filterIntrantsForHarvest,
  getMasterFromCid,
  calculateNumeroRecolte,
} from "../ipfsUtils";
import { getActeur } from "./gestionnaireActeurs";
import { getParcelle } from "./producteur";
import { hasRole } from "../roles";
import { collecteurProducteurRead, getCollecteurProducteurWrite } from "../../config/onChain/frontContracts";

const contrat = await getCollecteurProducteurContract();

/**
 *
 * @param {number} _idCommande
 * @param {Array} _roles
 * @param {string} _account
 * @returns
 */
export const getCommandeRecolte = async (
  _idCommande,
  _roles = [],
  _account = ""
) => {
  try {
    const res = await contrat.getCommande(_idCommande);

    if (_roles.length > 0 && hasRole(_roles, 3) && _account !== "")
      if (res?.collecteur.toString().toLowerCase() !== _account.toLowerCase())
        return { isProprietaire: false };

    const producteurDetails = await getActeur(res.producteur.toString());
    const collecteurDetails = await getActeur(res.collecteur.toString());
    const transporteurDetails =
      res.transporteur !== ethers.ZeroAddress
        ? await getActeur(res.transporteur.toString())
        : {};

    return {
      id: Number(res.id),
      idRecolte: Number(res.idRecolte),
      quantite: Number(res.quantite),
      prix: Number(res.prix),
      statutTransport: Number(res.statutTransport),
      statutRecolte: Number(res.statutRecolte),
      payer: res.payer,
      producteur: { ...producteurDetails, adresse: res.producteur.toString() },
      collecteur: { ...collecteurDetails, adresse: res.collecteur.toString() },
      enregistrerCondition: res.enregistrerCondition,
      transporteur: {
        ...transporteurDetails,
        adresse: res.transporteur.toString(),
      },
      isProprietaire: true,
    };
  } catch (error) {
    console.log("Recuperation commande lot produit : ", error);
    return {};
  }
};

/**
 *
 * @param {number} _idCommande
 * @returns
 */
export const getConditionTransportPC = async (_idCommande) => {
  let conditionComplet = {};
  // recuperer conditions transport on-chain
  try {
    const conditionOnChain = await contrat.getConditionTransport(_idCommande);
    conditionComplet = {
      id: conditionOnChain.id,
      cid: conditionOnChain.cid,
      hashMerkle: conditionOnChain.hashMerkle,
    };
  } catch (error) {
    console.error("Erreur recuperation condition transport CE : ", error);
    return;
  }
  // si il n'y a pas de cid, on arrete
  if (!conditionComplet.cid || conditionComplet.cid === "") {
    return conditionComplet;
  }
  // recuperer conditions transport ipfs
  const conditionIpfs = await getFileFromPinata(conditionComplet.cid);
  conditionComplet = {
    ...conditionComplet,
    ...conditionIpfs.data.items,
    ...conditionIpfs?.keyvalues,
  };
  return conditionComplet;
};

/**
 * Récupère toutes les récoltes d'une parcelle spécifique triées par date
 * @param {number} idParcelle - ID de la parcelle
 * @returns {Array} Liste des récoltes triées par date (plus ancienne en premier)
 */
export const getRecoltesParParcelle = async (idParcelle) => {
  try {
    const compteurRecoltes = await collecteurProducteurRead.read("compteurRecoltes");
    const recoltesParcelle = [];

    // Parcourir toutes les récoltes pour trouver celles de cette parcelle
    for (let i = 1; i <= compteurRecoltes; i++) {
      try {
        const recolteOnChain = await collecteurProducteurRead.read("getRecolte", i);
        const idParcelles = Object.values(recolteOnChain.idParcelle).map((id) =>
          Number(id)
        );

        // Si cette récolte concerne notre parcelle
        if (idParcelles.includes(Number(idParcelle))) {
          // Récupérer les données off-chain pour avoir la date
          let dateRecolte = null;
          if (recolteOnChain.cid && recolteOnChain.cid !== "") {
            try {
              const recolteIpfs = await getFileFromPinata(
                recolteOnChain.cid.toString()
              );
              dateRecolte = recolteIpfs?.data?.items?.dateRecolte;
            } catch (ipfsError) {
              console.warn(`Erreur IPFS pour récolte ${i}:`, ipfsError);
            }
          }

          if (dateRecolte) {
            recoltesParcelle.push({
              id: Number(recolteOnChain.id),
              dateRecolte: dateRecolte,
              idParcelles: idParcelles,
            });
          }
        }
      } catch (error) {
        console.warn(
          `Erreur lors de la récupération de la récolte ${i}:`,
          error
        );
      }
    }

    // Trier par date de récolte (plus ancienne en premier)
    return recoltesParcelle.sort(
      (a, b) => new Date(a.dateRecolte) - new Date(b.dateRecolte)
    );
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des récoltes par parcelle:",
      error
    );
    return [];
  }
};

/**
 * Trouve la date de la récolte précédente pour une récolte donnée sur une parcelle
 * @param {number} idParcelle - ID de la parcelle
 * @param {string} dateRecolteActuelle - Date de la récolte actuelle
 * @returns {string|null} Date de la récolte précédente ou null si première récolte
 */
export const getDateRecoltePrecedente = async (
  idParcelle,
  dateRecolteActuelle
) => {
  try {
    const recoltesParParcelle = await getRecoltesParParcelle(idParcelle);
    const dateActuelle = new Date(dateRecolteActuelle);

    // Trouver la récolte précédente (la plus récente avant la date actuelle)
    let recoltePrecedente = null;
    for (const recolte of recoltesParParcelle) {
      const dateRecolte = new Date(recolte.dateRecolte);
      if (dateRecolte < dateActuelle) {
        recoltePrecedente = recolte;
      } else {
        break; // On a dépassé la date actuelle
      }
    }

    return recoltePrecedente ? recoltePrecedente.dateRecolte : null;
  } catch (error) {
    console.error(
      "Erreur lors de la recherche de la récolte précédente:",
      error
    );
    return null;
  }
};

/**
 *
 * @param {number} _idRecolte
 * @returns {object}
 */
export const getRecolte = async (
  _idRecolte,
  _roles = [],
  _account = "",
  forHashTransaction = false
) => {
  let recolteComplet = {};

  // recuperer info on-chain
  try {
    const recolteOnChain = await collecteurProducteurRead.read(
      "getRecolte",
      _idRecolte
    );

    // Afficher uniquement les recoltes de l'adresse connectée si c'est un producteur et pas collecteur
    if (!_roles.includes(3) && _account !== "")
      if (_roles.includes(0))
        if (recolteOnChain.producteur?.toLowerCase() !== _account.toLowerCase())
          return { isProprietaire: false };

    // convertir array
    const idParcelles = Object.values(recolteOnChain.idParcelle);
    // recuperer details acteur
    const producteurDetails = await getActeur(
      recolteOnChain.producteur.toString()
    );

    recolteComplet = {
      id: Number(recolteOnChain.id),
      quantite: Number(recolteOnChain.quantite),
      prixUnit: Number(recolteOnChain.prixUnit),
      idParcelle: idParcelles.map((id) => Number(id)),
      certifie: recolteOnChain.certifie,
      certificatPhytosanitaire:
        recolteOnChain.certificatPhytosanitaire.toString(),
      producteur: {
        ...producteurDetails,
        adresse: recolteOnChain.producteur.toString(),
      },
      hashMerkle: recolteOnChain.hashMerkle.toString(),
      cid: recolteOnChain.cid.toString(),
    };
  } catch (error) {
    console.error("Recuperation recolte : ", error);
  }

  // recuperation info off-chain
  if (recolteComplet.cid && recolteComplet.cid !== "") {
    const recolteIpfs = await getFileFromPinata(recolteComplet.cid);

    // Si pour recuperation de hash transaction
    if (forHashTransaction)
      return { ...recolteComplet, ...recolteIpfs?.keyvalues };

    // Format : jour mois année
    let dateRecolteFormat = "N/A";
    const dateRecolteOriginal = recolteIpfs?.data?.items?.dateRecolte;

    if (dateRecolteOriginal && dateRecolteOriginal !== "") {
      dateRecolteFormat = new Date(dateRecolteOriginal).toLocaleDateString(
        "fr-FR",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      );
    }

    // 🌿 PRIORISER les intrants stockés dans IPFS (nouvelles récoltes)
    let intrantsUtilises = [];
    let dateRecoltePrecedente = null;

    // Vérifier si les intrants sont déjà stockés dans le fichier IPFS de la récolte
    if (
      recolteIpfs?.data?.items?.intrantsUtilises &&
      Array.isArray(recolteIpfs.data.items.intrantsUtilises)
    ) {
      // Utiliser les intrants déjà stockés (version 2.0+)
      intrantsUtilises = recolteIpfs.data.items.intrantsUtilises;
      dateRecoltePrecedente =
        recolteIpfs.data.items.dateRecoltePrecedente || null;

      console.log(
        `📦 Intrants récupérés depuis IPFS pour récolte ${recolteComplet.id}:`,
        {
          count: intrantsUtilises.length,
          source: "IPFS_STORED",
          version: recolteIpfs.data.items.version || "2.0",
        }
      );

      return {
        ...recolteIpfs.data.items,
        ...recolteIpfs?.keyvalues,
        ...recolteComplet,
        dateRecolte: dateRecolteFormat,
        dateRecolteOriginal: dateRecolteOriginal, // Garder la date originale pour les calculs
        dateRecoltePrecedente: dateRecoltePrecedente, // Date de la récolte précédente
        intrantsSource: recolteIpfs?.data?.items?.intrantsUtilises
          ? "IPFS_STORED"
          : "DYNAMIC_CALC", // Indicateur de source
        isProprietaire: true,
      };
    }
    // Pour les anciennes recoltes
    else {
      // Fallback: calcul dynamique pour les anciennes récoltes (version 1.0)
      console.log(
        `🔄 Calcul dynamique des intrants pour récolte ${recolteComplet.id} (version 1.0)`
      );

      // Calculer la saison basée sur la date de récolte avec logique dynamique
      let [saison, numeroRecolte] = await getSaisonEtNumRecolte(
        recolteComplet,
        dateRecolteOriginal
      );

      // Recuperer les intrants utiliser
      [intrantsUtilises, dateRecoltePrecedente] =
        await getIntrantUtiliseEtDateRecoltePrecedent(
          recolteComplet,
          dateRecolteOriginal
        );

      // Pour la première parcelle, récupérer la date de récolte précédente pour l'affichage
      if (!dateRecoltePrecedente && recolteComplet.idParcelle.length > 0) {
        dateRecoltePrecedente = await getDateRecoltePrecedente(
          recolteComplet.idParcelle[0],
          dateRecolteOriginal
        );
      }

      return {
        ...recolteIpfs.data.items,
        ...recolteIpfs?.keyvalues,
        ...recolteComplet,
        dateRecolte: dateRecolteFormat,
        dateRecolteOriginal: dateRecolteOriginal, // Garder la date originale pour les calculs
        dateRecoltePrecedente: dateRecoltePrecedente, // Date de la récolte précédente
        saison: saison,
        numeroRecolte: numeroRecolte, // Ajouter le numéro de récolte
        intrantsUtilises: intrantsUtilises,
        intrantsSource: recolteIpfs?.data?.items?.intrantsUtilises
          ? "IPFS_STORED"
          : "DYNAMIC_CALC", // Indicateur de source
        isProprietaire: true,
      };
    }
  } else {
    return { ...recolteComplet, isProprietaire: true };
  }
};

// Recuperer tous les recoltes d'un producteur
export const getRecoltesProducteur = async (account) => {
  try {
    const compteurRecoltes = await collecteurProducteurRead.read(
      "compteurRecoltes"
    );

    let i;
    let allRecoltes = [];

    for (i = compteurRecoltes; i >= DEBUT_RECOLTE; i--) {
      // Filtre les recoltes si 'address' est definie dans l'url
      let recolteRaw = await getRecolte(i, [0], account);

      if (!recolteRaw.isProprietaire) continue;

      allRecoltes.push(recolteRaw);
    }
    return allRecoltes;
  } catch (error) {
    console.error("❌ Erreur chargement récoltes:", error);
    return;
  }
};

/**
 * Crée une récolte avec stockage des intrants utilisés dans IPFS
 * @param {object} recolteData
 * @param {object} parcelle
 */
export const createRecolte = async (recolteData, parcelle) => {
  let cidRecolte = "";
  let tx = {};
  let recolteUpload = {};
  let intrantsUtilises = [];
  let dateRecoltePrecedente = null;
  let numeroRecolte = 1;
  let intrantsParcelle = [];

  try {
    const contratProcteur = await getCollecteurProducteurWrite();

    // 1. Récupérer les intrants valides selon la règle d'association
    try {
      // Récupérer la date de la récolte précédente
      dateRecoltePrecedente = await getDateRecoltePrecedente(
        parcelle.id,
        recolteData.dateRecolte
      );

      // Calculer le numéro de récolte pour cette parcelle
      const recoltesExistantes = await getRecoltesParParcelle(parcelle.id);
      numeroRecolte = await calculateNumeroRecolte(
        parcelle.id,
        recolteData.dateRecolte,
        recoltesExistantes
      );

      // Récupérer les intrants de la parcelle
      if (parcelle && parcelle.cid) {
        const masterParcelle = await getMasterFromCid(parcelle.cid);
        intrantsParcelle = Array.isArray(masterParcelle?.intrants)
          ? masterParcelle.intrants
          : [];

        // Filtrer selon la règle d'association
        intrantsUtilises = filterIntrantsForHarvest(
          intrantsParcelle,
          recolteData.dateRecolte,
          dateRecoltePrecedente
        );

        console.log(`🌿 Intrants validés pour nouvelle récolte:`, {
          parcelle: parcelle.id,
          dateRecolte: recolteData.dateRecolte,
          dateRecoltePrecedente: dateRecoltePrecedente || "Première récolte",
          numeroRecolte: numeroRecolte,
          intrantsCount: intrantsUtilises.length,
          intrants: intrantsUtilises.map((i) => `${i.nom} (${i.dateAjout})`),
        });
      }
    } catch (intrantsError) {
      console.warn(
        "Erreur lors de la récupération des intrants:",
        intrantsError
      );
    }

    // 2. Créer l'objet récolte consolidé avec intrants pour IPFS
    // Calculer la saison dynamique
    const saison = computeSeasonFromDate(
      recolteData.dateRecolte,
      dateRecoltePrecedente,
      intrantsParcelle,
      parcelle.id,
      numeroRecolte
    );

    const recolteConsolidee = {
      type: "recolte",
      parcelleId: parseInt(parcelle.id),
      nomProduit: recolteData.nomProduit,
      quantite: parseInt(recolteData.quantite),
      prix: parseInt(recolteData.prix),
      dateRecolte: recolteData.dateRecolte,
      producteur: parcelle.producteur?.adresse,
      parcelleHashMerkle: parcelle?.hashMerkle || "",
      // 🌿 NOUVEAUTÉ: Stockage des intrants utilisés dans IPFS
      intrantsUtilises: intrantsUtilises,
      dateRecoltePrecedente: dateRecoltePrecedente,
      numeroRecolte: numeroRecolte, // Nouveau: numéro de récolte séquentiel
      saison: saison, // Nouvelle logique de saison dynamique
      regleAssociation: {
        appliquee: true,
        version: "1.0",
        description:
          "Intrants appliqués après récolte précédente et avant/à récolte actuelle",
      },
      cidCalendrierCultural: recolteData.cidCalendrierCultural,
      timestamp: Date.now(),
      version: "2.1", // Version améliorée avec saison dynamique
    };

    // 3. Upload des données consolidées sur IPFS
    recolteUpload = await uploadConsolidatedData(recolteConsolidee, "recolte");
    cidRecolte = recolteUpload.cid;
    if (!recolteUpload.success) {
      throw new Error(
        "Erreur lors de l'upload des données de récolte sur IPFS"
      );
    }

    // 4. Créer la récolte avec le CID IPFS
    tx = await contratProcteur.write("ajoutRecolte", [
      [parseInt(parcelle.id)], // Tableau de parcelles
      parseInt(recolteData.quantite),
      parseInt(recolteData.prix),
      recolteUpload.cid // CID IPFS
    ]);
  } catch (error) {
    console.error("Creation recolte :", error);

    // supprimer le fichier sur ipfs si erreur
    if (cidRecolte !== "") deleteFromIPFSByCid(cidRecolte);

    throw new Error("Creation recolte.");
  }

  // 5. Ajouter hash transaction aux keyvalues du fichier recolte sur ipfs
  try {
    await ajouterKeyValuesFileIpfs(recolteUpload.cid, {
      hashTransaction: String(tx.hash),
      intrantsStoredCount: String(intrantsUtilises.length),
      intrantsStoredAt: String(new Date().toISOString()),
    });

    console.log(
      `✅ Récolte créée avec ${intrantsUtilises.length} intrants stockés dans IPFS`
    );
  } catch (error) {
    console.error("Ajout keyvalues a fichier recolte sur ipfs :", error);
    throw error;
  }
};

/**
 *
 * @param {object} recolteComplet
 * @param {string} dateRecolteOriginal
 * @returns {Array}
 */
const getSaisonEtNumRecolte = async (recolteComplet, dateRecolteOriginal) => {
  try {
    // Récupérer les intrants de la première parcelle pour calculer la saison
    const premiereParcelle = recolteComplet.idParcelle[0];
    const parcelle = await getParcelle(premiereParcelle);
    let intrantsParcelle = [];

    if (parcelle && parcelle.cid) {
      const masterParcelle = await getMasterFromCid(parcelle.cid);
      intrantsParcelle = Array.isArray(masterParcelle?.intrants)
        ? masterParcelle.intrants
        : [];
    }

    // Calculer le numéro de récolte
    const recoltesExistantes = await getRecoltesParParcelle(premiereParcelle);
    let numeroRecolte = await calculateNumeroRecolte(
      premiereParcelle,
      dateRecolteOriginal,
      recoltesExistantes
    );

    // Calculer la date de récolte précédente
    const dateRecoltePrecedente = await getDateRecoltePrecedente(
      premiereParcelle,
      dateRecolteOriginal
    );

    // Calculer la saison dynamique
    let saison = computeSeasonFromDate(
      dateRecolteOriginal,
      dateRecoltePrecedente,
      intrantsParcelle,
      premiereParcelle,
      numeroRecolte
    );

    return [saison, numeroRecolte];
  } catch (saisonError) {
    console.warn("Erreur calcul saison dynamique:", saisonError);
    // Fallback vers ancien système si erreur
    const year = new Date(dateRecolteOriginal).getUTCFullYear();
    let saison = {
      nom: `Culture ${year}-R${1}`,
      identifiant: `${year}-R${1}`,
      annee: year,
      numeroRecolte: 1,
      typeSaison: "fallback",
    };

    return [saison, 1];
  }
};

/**
 *
 * @param {object} recolteComplet
 * @param {string} dateRecolteOriginal
 * @returns {Array}
 */
const getIntrantUtiliseEtDateRecoltePrecedent = async (
  recolteComplet,
  dateRecolteOriginal
) => {
  try {
    let intrantsUtilises = [];
    let dateRecoltePrecedente = null;

    // Pour chaque parcelle associée à cette récolte
    for (const idParcelle of recolteComplet.idParcelle) {
      try {
        const parcelle = await getParcelle(idParcelle);
        if (parcelle && parcelle.cid) {
          const masterParcelle = await getMasterFromCid(parcelle.cid);
          const intrantsParcelle = Array.isArray(masterParcelle?.intrants)
            ? masterParcelle.intrants
            : [];

          // Trouver la date de la récolte précédente pour cette parcelle
          dateRecoltePrecedente = await getDateRecoltePrecedente(
            idParcelle,
            dateRecolteOriginal
          );

          console.log(
            `🌿 Parcelle ${idParcelle} - Récolte actuelle: ${dateRecolteOriginal}, Précédente: ${
              dateRecoltePrecedente || "Aucune"
            }`
          );

          // Filtrer les intrants selon la nouvelle règle
          const intrantsFilters = filterIntrantsForHarvest(
            intrantsParcelle,
            dateRecolteOriginal,
            dateRecoltePrecedente
          );

          console.log(
            `🌿 ${intrantsFilters.length} intrants validés pour la parcelle ${idParcelle}`
          );
          intrantsUtilises.push(...intrantsFilters);
        }
      } catch (parcelleError) {
        console.warn(
          `Erreur récupération parcelle ${idParcelle}:`,
          parcelleError
        );
      }
    }

    // Supprimer les doublons d'intrants si plusieurs parcelles ont les mêmes
    intrantsUtilises = intrantsUtilises.filter(
      (intrant, index, self) =>
        index ===
        self.findIndex(
          (i) => i.nom === intrant.nom && i.dateAjout === intrant.dateAjout
        )
    );

    return [intrantsUtilises, dateRecoltePrecedente];
  } catch (intrantsError) {
    console.warn("Erreur récupération intrants:", intrantsError);
  }
};
