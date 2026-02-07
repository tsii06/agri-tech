import { useQueries } from "@tanstack/react-query";
import { hasRole } from "../../utils/roles";
import { getProduitEnrichi } from "../../utils/collecteurExporatateur";

export const PRODUITS_KEYS = {
  all: ["madtx-produits"],
  lists: () => [...PRODUITS_KEYS.all, "list"],
  list: (filters) => [...PRODUITS_KEYS.lists(), filters],
  details: () => [...PRODUITS_KEYS.all, "detail"],
  detail: (id, filters = {}) => [...PRODUITS_KEYS.details(), id, filters],
};

// Recuperation un a un produits dans caches.
export function useProduitsUnAUn(idsToFetch, roles = [], account = "") {
  return useQueries({
    queries: idsToFetch.map((id) => ({
      // Si collecteur, utiliser un queryKey specifique.
      queryKey: hasRole(roles, 3)
        ? PRODUITS_KEYS.detail(id, { collecteur: account })
        : PRODUITS_KEYS.detail(id),
      queryFn: async () => await getProduitEnrichi(id, roles, account),
      enabled: !!idsToFetch,
    })),
  });
}
