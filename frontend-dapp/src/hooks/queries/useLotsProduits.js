import { useQueries } from "@tanstack/react-query";
import { hasRole } from "../../utils/roles";
import { getLotProduitEnrichi } from "../../utils/collecteurExporatateur";

export const LOTS_PRODUITS_KEYS = {
  all: ["madtx-lots-produits"],
  lists: () => [...LOTS_PRODUITS_KEYS.all, "list"],
  list: (filters) => [...LOTS_PRODUITS_KEYS.lists(), filters],
  details: () => [...LOTS_PRODUITS_KEYS.all, "detail"],
  detail: (id, filters = {}) => [...LOTS_PRODUITS_KEYS.details(), id, filters],
};

// Recuperation un a un recoltes dans caches.
export function useLotsProduitsUnAUn(idsToFetch, roles = [], account = "") {
  return useQueries({
    queries: idsToFetch.map((id) => ({
      // Si collecteur, utiliser un queryKey specifique.
      queryKey: hasRole(roles, 3)
        ? LOTS_PRODUITS_KEYS.detail(id, { collecteur: account })
        : LOTS_PRODUITS_KEYS.detail(id),
      queryFn: async () => await getLotProduitEnrichi(id, roles, account),
      enabled: !!idsToFetch,
    })),
  });
}
