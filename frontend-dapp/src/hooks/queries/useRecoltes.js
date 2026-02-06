import { useQueries, useQuery } from "@tanstack/react-query";
import {
  getAllRecoltes,
  getRecolte,
  getRecoltesProducteur,
} from "../../utils/contrat/collecteurProducteur";
import { hasRole } from "../../utils/roles";

export const RECOLTES_KEYS = {
  all: ["madtx-recoltes"],
  lists: () => [...RECOLTES_KEYS.all, "list"],
  list: (filters) => [...RECOLTES_KEYS.lists(), filters],
  details: () => [...RECOLTES_KEYS.all, "detail"],
  detail: (id, filters = {}) => [...RECOLTES_KEYS.details(), id, filters],
};

// Recuperer tous les parcelles d'un producteur dans le cache
export function useRecoltesProducteur(account) {
  return useQuery({
    queryKey: RECOLTES_KEYS.list({ producteur: account }),
    queryFn: async () => await getRecoltesProducteur(account),
    // Gestion d'erreur custom
    throwOnError: false, // Pas de throw, géré localement
  });
}

// Recuperer tous les parcelles d'un producteur dans le cache
export function useRecoltes() {
  return useQuery({
    queryKey: RECOLTES_KEYS.lists(),
    queryFn: async () => await getAllRecoltes(),
    // Gestion d'erreur custom
    throwOnError: false, // Pas de throw, géré localement
  });
}

// Recuperation un a un recoltes dans caches.
export function useRecoltesUnAUn(idsToFetch, roles = [], account = "") {
  return useQueries({
    queries: idsToFetch.map((id) => ({
      // Si producteur, utiliser un queryKey specifique.
      queryKey: hasRole(roles, 0)
        ? RECOLTES_KEYS.detail(id, { producteur: account })
        : RECOLTES_KEYS.detail(id),
      queryFn: async () => await getRecolte(id, roles, account),
      enabled: !!idsToFetch,
    })),
  });
}
