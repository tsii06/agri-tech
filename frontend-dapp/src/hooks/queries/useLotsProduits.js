import { useQueries, useQuery } from "@tanstack/react-query";
import { hasRole } from "../../utils/roles";
import { getLotProduitEnrichi } from "../../utils/collecteurExporatateur";
import { collecteurExportateurRead } from "../../config/onChain/frontContracts";
import { DEBUT_LOT_PRODUIT } from "../../utils/contract";

export const LOTS_PRODUITS_KEYS = {
  all: ["madtx-lots-produits"],
  lists: () => [...LOTS_PRODUITS_KEYS.all, "list"],
  list: (filters) => [...LOTS_PRODUITS_KEYS.lists(), filters],
  details: () => [...LOTS_PRODUITS_KEYS.all, "detail"],
  detail: (id, filters = {}) => [...LOTS_PRODUITS_KEYS.details(), id, filters],
  compteur: ["madtx-compteurs-lots-produits"],
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

// Recuperer un tab contenant tous les ids de lot produits.
export function useLotsProduitsIDs() {
  return useQuery({
    queryKey: LOTS_PRODUITS_KEYS.compteur,
    queryFn: async () => {
      const compteurLotProduits = Number(
        await collecteurExportateurRead.read("compteurLotProduits")
      );
      const lotsProduitsIDs = Array.from(
        { length: compteurLotProduits - DEBUT_LOT_PRODUIT + 1 },
        (_, i) => compteurLotProduits - i
      );
      return lotsProduitsIDs;
    },
  });
}
