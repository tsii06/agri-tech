import { useQueries, useQuery } from "@tanstack/react-query";
import { getAllCommandesRecoltes, getCommandeRecolte } from "../../utils/contrat/collecteurProducteur";
import { hasRole } from "../../utils/roles";

export const COMMANDES_RECOLTES_KEYS = {
  all: ["madtx-recoltes"],
  lists: () => [...COMMANDES_RECOLTES_KEYS.all, "list"],
  list: (filters) => [...COMMANDES_RECOLTES_KEYS.lists(), filters],
  details: () => [...COMMANDES_RECOLTES_KEYS.all, "detail"],
  detail: (id, filters = {}) => [...COMMANDES_RECOLTES_KEYS.details(), id, filters],
};

// Recuperer tous les parcelles d'un producteur dans le cache
export function useCommandesRecoltesCollecteur(roles, account) {
  return useQuery({
    queryKey: COMMANDES_RECOLTES_KEYS.list({ collecteur: account }),
    queryFn: async () => await getAllCommandesRecoltes(roles, account),
    // Gestion d'erreur custom
    throwOnError: false, // Pas de throw, géré localement
  });
}

// Recuperation un a un recoltes dans caches.
export function useCommandesRecoltesUnAUn(idsToFetch, roles = [], account = "") {
  return useQueries({
    queries: idsToFetch.map((id) => ({
      // Si producteur, utiliser un queryKey specifique.
      queryKey: hasRole(roles, 0)
        ? COMMANDES_RECOLTES_KEYS.detail(id, { producteur: account })
        : COMMANDES_RECOLTES_KEYS.detail(id),
      queryFn: async () => await getCommandeRecolte(id, roles, account),
      enabled: !!idsToFetch,
    })),
  });
}