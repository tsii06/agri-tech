import { useQueries, useQuery } from "@tanstack/react-query";
import {
  getAllDataAnterieur,
  getAllExpeditions,
  getConditionsTransportExpedition,
  getDetailsExpeditionByRef,
  getExpedition,
  getLotProduisExpedition,
  getParcellesExpedition,
  getRecoltesExpedition,
} from "../../utils/contrat/exportateurClient";
import { hasRole } from "../../utils/roles";
import { exportateurClientRead } from "../../config/onChain/frontContracts";
import { DEBUT_EXPEDITION } from "../../utils/contract";
import creerNodesProcessus from "../../components/Tools/expedition/utilsProcessus";

export const EXPEDITIONS_KEYS = {
  all: ["madtx-expeditions"],
  lists: () => [...EXPEDITIONS_KEYS.all, "list"],
  list: (filters) => [...EXPEDITIONS_KEYS.lists(), filters],
  details: () => [...EXPEDITIONS_KEYS.all, "detail"],
  detail: (id, filters = {}) => [...EXPEDITIONS_KEYS.details(), id, filters],
  reference: (ref) => [...EXPEDITIONS_KEYS.all, { reference: ref }],
  compteur: ["madtx-compteur-expeditions"],
};

// Recuperer tous les expeditions dans le cache
export function useExpeditions() {
  return useQuery({
    queryKey: EXPEDITIONS_KEYS.lists(),
    queryFn: async () => await getAllExpeditions(),
    // Gestion d'erreur custom
    throwOnError: false, // Pas de throw, géré localement
  });
}

// Recuperer tous les parcelles d'un producteur dans le cache
export function useExpeditionsExportateur(account) {
  return useQuery({
    queryKey: EXPEDITIONS_KEYS.list({ exportateur: account }),
    queryFn: async () => {},
    // Gestion d'erreur custom
    throwOnError: false, // Pas de throw, géré localement
  });
}

// Recuperation un a un expedition dans caches.
export function useExpeditionsUnAUn(idsToFetch, roles = [], account = "") {
  return useQueries({
    queries: idsToFetch.map((id) => ({
      // Si exportateur, utiliser un queryKey specifique.
      queryKey: hasRole(roles, 6)
        ? EXPEDITIONS_KEYS.detail(id, { exportateur: account })
        : EXPEDITIONS_KEYS.detail(id),
      queryFn: async () => await getExpedition(id, roles, account),
      enabled: !!idsToFetch,
    })),
  });
}

// Recuperer un tab contenant tous les ids des expeditions.
export function useExpeditionsIDs() {
  return useQuery({
    queryKey: EXPEDITIONS_KEYS.compteur,
    queryFn: async () => {
      const compteur = Number(
        await exportateurClientRead.read("compteurExpeditions")
      );
      const tabIDs = Array.from(
        { length: compteur - DEBUT_EXPEDITION + 1 },
        (_, i) => compteur - i
      );
      return tabIDs;
    },
  });
}

// Recuperer expedition by ref
export function useExpeditionByRef(ref) {
  return useQuery({
    queryKey: EXPEDITIONS_KEYS.reference(ref),
    queryFn: async () => await getDetailsExpeditionByRef(ref),
    // Gestion d'erreur custom
    throwOnError: false, // Pas de throw, géré localement
  });
}

// Recuperer conditions transport expedition
export function useConditionsTransportExpedition(expedition) {
  return useQuery({
    queryKey: EXPEDITIONS_KEYS.detail(expedition?.id, "conditions-transport"),
    queryFn: async () => await getConditionsTransportExpedition(expedition),
    // Gestion d'erreur custom
    throwOnError: false, // Pas de throw, géré localement
    enabled: expedition !== undefined,
  });
}

// Recuperer lots produits expedition
export function useLotsProduitsExpedition(expedition) {
  return useQuery({
    queryKey: EXPEDITIONS_KEYS.detail(expedition?.id, "lots-produits"),
    queryFn: async () => await getLotProduisExpedition(expedition),
    // Gestion d'erreur custom
    throwOnError: false, // Pas de throw, géré localement
    enabled: expedition !== undefined,
  });
}

// Recuperer recoltes expedition
export function useRecoltesExpedition(expedition) {
  return useQuery({
    queryKey: EXPEDITIONS_KEYS.detail(expedition?.id, "recoltes"),
    queryFn: async () => await getRecoltesExpedition(expedition),
    // Gestion d'erreur custom
    throwOnError: false, // Pas de throw, géré localement
    enabled: expedition !== undefined,
  });
}

// Recuperer parcelles expedition
export function useParcellesExpedition(expedition) {
  return useQuery({
    queryKey: EXPEDITIONS_KEYS.detail(expedition?.id, "parcelles"),
    queryFn: async () => await getParcellesExpedition(expedition),
    // Gestion d'erreur custom
    throwOnError: false, // Pas de throw, géré localement
    enabled: expedition !== undefined,
  });
}

// Recuperer data expedition pour visualisation proccessus
export function useVisualisationProccessExpedition(expedition) {
  return useQuery({
    queryKey: EXPEDITIONS_KEYS.detail(expedition?.id, "proccess"),
    queryFn: async () => await creerNodesProcessus(expedition),
    // Gestion d'erreur custom
    throwOnError: false, // Pas de throw, géré localement
    enabled: expedition !== undefined,
  });
}

// Recuperer all data anterieur expedition
export function useAllDataAnterieurExpedition(id, idCommandesLotsProduits) {
  return useQuery({
    queryKey: EXPEDITIONS_KEYS.detail(id, "all-data-anterieur"),
    queryFn: async () => await getAllDataAnterieur(idCommandesLotsProduits),
    // Gestion d'erreur custom
    throwOnError: false, // Pas de throw, géré localement
    enabled: idCommandesLotsProduits != null,
  });
}
