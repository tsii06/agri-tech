import { useQueries } from "@tanstack/react-query";
import {
  getRecolte,
} from "../../utils/contrat/collecteurProducteur";
import { hasRole } from "../../utils/roles";

export const RECOLTES_KEYS = {
  all: ["madtx-recoltes"],
  lists: () => [...RECOLTES_KEYS.all, "list"],
  list: (filters) => [...RECOLTES_KEYS.lists(), filters],
  details: () => [...RECOLTES_KEYS.all, "detail"],
  detail: (id, filters = {}) => [...RECOLTES_KEYS.details(), id, filters],
};

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
