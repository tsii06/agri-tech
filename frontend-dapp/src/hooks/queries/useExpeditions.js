import { useQueries, useQuery } from "@tanstack/react-query";
import { getAllExpeditions, getExpedition } from "../../utils/contrat/exportateurClient";
import { hasRole } from "../../utils/roles";
import { exportateurClientRead } from "../../config/onChain/frontContracts";
import { DEBUT_EXPEDITION } from "../../utils/contract";

export const EXPEDITIONS_KEYS = {
  all: ["madtx-expeditions"],
  lists: () => [...EXPEDITIONS_KEYS.all, "list"],
  list: (filters) => [...EXPEDITIONS_KEYS.lists(), filters],
  details: () => [...EXPEDITIONS_KEYS.all, "detail"],
  detail: (id) => [...EXPEDITIONS_KEYS.details(), id],
  compteur: ["madtx-compteur-expeditions"]
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
