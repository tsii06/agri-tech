import { useQueries, useQuery } from "@tanstack/react-query";
import { hasRole } from "../../utils/roles";
import { getProduitEnrichi } from "../../utils/collecteurExporatateur";
import { collecteurExportateurRead } from "../../config/onChain/frontContracts";
import { DEBUT_PRODUIT } from "../../utils/contract";

export const PRODUITS_KEYS = {
  all: ["madtx-produits"],
  lists: () => [...PRODUITS_KEYS.all, "list"],
  list: (filters) => [...PRODUITS_KEYS.lists(), filters],
  details: () => [...PRODUITS_KEYS.all, "detail"],
  detail: (id, filters = {}) => [...PRODUITS_KEYS.details(), id, filters],
  compteur: ["madtx-compteur-produits"],
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

// Recuperer tab des ids de produits
export function useProduitsIDs() {
  return useQuery({
    queryKey: PRODUITS_KEYS.compteur,
    queryFn: async () => {
      // Tab de tous les ids recoltes
      const compteur = Number(
        await collecteurExportateurRead.read("getCompteurProduit")
      );
      const tabIDs = Array.from(
        { length: compteur - DEBUT_PRODUIT + 1 },
        (_, i) => compteur - i
      );
      return tabIDs;
    },
  });
}
