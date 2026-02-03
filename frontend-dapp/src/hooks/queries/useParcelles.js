import { useQuery } from "@tanstack/react-query";
import { getParcellesProducteur } from "../../utils/contrat/producteur";

export const PARCELLES_KEYS = {
  all: ["madtx-parcelles"],
  lists: () => [...PARCELLES_KEYS.all, "list"],
  list: (filters) => [...PARCELLES_KEYS.lists(), filters],
  details: () => [...PARCELLES_KEYS.all, "detail"],
  detail: (id) => [...PARCELLES_KEYS.details(), id],
};

// Recuperer tous les parcelles dans le cache
export function useParcelles(queryFonction, filters = {}) {
  return useQuery({
    queryKey: PARCELLES_KEYS.list(filters),
    queryFn: () => queryFonction(),
    // Gestion d'erreur custom
    throwOnError: false, // Pas de throw, géré localement
  });
}

// Recuperer tous les parcelles d'un producteur dans le cache
export function useParcellesProducteur(account) {
  return useQuery({
    queryKey: PARCELLES_KEYS.list({ producteur: account }),
    queryFn: () => getParcellesProducteur(account),
    // Gestion d'erreur custom
    throwOnError: false, // Pas de throw, géré localement
  });
}
