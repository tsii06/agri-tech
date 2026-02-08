import { useQueries, useQuery } from "@tanstack/react-query";
import { getAllParcelles, getParcelle, getParcellesProducteur } from "../../utils/contrat/producteur";
import { hasRole } from "../../utils/roles";
import { producteurEnPhaseCultureRead } from "../../config/onChain/frontContracts";
import { DEBUT_PARCELLE } from "../../utils/contract";

export const PARCELLES_KEYS = {
  all: ["madtx-parcelles"],
  lists: () => [...PARCELLES_KEYS.all, "list"],
  list: (filters) => [...PARCELLES_KEYS.lists(), filters],
  details: () => [...PARCELLES_KEYS.all, "detail"],
  detail: (id, filters = {}) => [...PARCELLES_KEYS.details(), id, filters],
  compteur: ["madtx-compteur-parcelles"]
};

// Recuperer tous les parcelles dans le cache
export function useParcelles() {
  return useQuery({
    queryKey: PARCELLES_KEYS.lists(),
    queryFn: async () => await getAllParcelles(),
    // Gestion d'erreur custom
    throwOnError: false, // Pas de throw, géré localement
  });
}

// Recuperer tous les parcelles d'un producteur dans le cache
export function useParcellesProducteur(account) {
  return useQuery({
    queryKey: PARCELLES_KEYS.list({ producteur: account }),
    queryFn: async () => await getParcellesProducteur(account),
    // Gestion d'erreur custom
    throwOnError: false, // Pas de throw, géré localement
  });
}

// Recuperation un a un parcelles dans caches.
export function useParcellesUnAUn(idsToFetch, roles = [], account = "") {
  return useQueries({
    queries: idsToFetch.map((id) => ({
      // Si producteur, utiliser un queryKey specifique.
      queryKey: hasRole(roles, 0)
        ? PARCELLES_KEYS.detail(id, { producteur: account })
        : PARCELLES_KEYS.detail(id),
      queryFn: async () => await getParcelle(id, roles, account),
      enabled: !!idsToFetch,
    })),
  });
}

// Recuperer tab des ids de parcelles
export function useParcellesIDs() {
  return useQuery({
    queryKey: PARCELLES_KEYS.compteur,
    queryFn: async () => {
      // Tab de tous les ids recoltes
      const compteur = Number(
        await producteurEnPhaseCultureRead.read("getCompteurParcelle")
      );
      const tabIDs = Array.from(
        { length: compteur - DEBUT_PARCELLE + 1 },
        (_, i) => compteur - i
      );
      return tabIDs;
    },
  });
}
