import { useQuery } from "@tanstack/react-query";
import { getRecoltesProducteur } from "../../utils/contrat/collecteurProducteur";

export const RECOLTES_KEYS = {
  all: ["madtx-recoltes"],
  lists: () => [...RECOLTES_KEYS.all, "list"],
  list: (filters) => [...RECOLTES_KEYS.lists(), filters],
  details: () => [...RECOLTES_KEYS.all, "detail"],
  detail: (id) => [...RECOLTES_KEYS.details(), id],
};

// Recuperer tous les parcelles d'un producteur dans le cache
export function useRecoltesProducteur(account) {
  return useQuery({
    queryKey: RECOLTES_KEYS.list({ producteur: account }),
    queryFn: () => getRecoltesProducteur(account),
    // Gestion d'erreur custom
    throwOnError: false, // Pas de throw, géré localement
  });
}