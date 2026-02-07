import { useQueries } from "@tanstack/react-query";
import { getCommandeRecolte } from "../../utils/contrat/collecteurProducteur";
import { hasRole } from "../../utils/roles";

export const COMMANDES_RECOLTES_KEYS = {
  all: ["madtx-commandes-recoltes"],
  lists: () => [...COMMANDES_RECOLTES_KEYS.all, "list"],
  list: (filters) => [...COMMANDES_RECOLTES_KEYS.lists(), filters],
  details: () => [...COMMANDES_RECOLTES_KEYS.all, "detail"],
  detail: (id, filters = {}) => [
    ...COMMANDES_RECOLTES_KEYS.details(),
    id,
    filters,
  ],
};

// Recuperation un a un recoltes dans caches.
export function useCommandesRecoltesUnAUn(
  idsToFetch,
  roles = [],
  account = ""
) {
  return useQueries({
    queries: idsToFetch.map((id) => ({
      // Si collecteur ou transporteur, utiliser un queryKey specifique.
      queryKey: hasRole(roles, 3)
        ? COMMANDES_RECOLTES_KEYS.detail(id, { collecteur: account })
        : hasRole(roles, 5)
        ? COMMANDES_RECOLTES_KEYS.detail(id, { transporteur: account })
        : COMMANDES_RECOLTES_KEYS.detail(id),
      queryFn: async () => await getCommandeRecolte(id, roles, account),
      enabled: !!idsToFetch,
    })),
  });
}
