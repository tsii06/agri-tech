import { useQueries, useQuery } from "@tanstack/react-query";
import { hasRole } from "../../utils/roles";
import { collecteurExportateurRead } from "../../config/onChain/frontContracts";
import { DEBUT_COMMANDE_LOT_PRODUIT } from "../../utils/contract";
import { getCommandeLotProduitEnrichi } from "../../utils/collecteurExporatateur";

export const COMMANDES_LOTS_PRODUITS_KEYS = {
  all: ["madtx-commandes-lots-produits"],
  lists: () => [...COMMANDES_LOTS_PRODUITS_KEYS.all, "list"],
  list: (filters) => [...COMMANDES_LOTS_PRODUITS_KEYS.lists(), filters],
  details: () => [...COMMANDES_LOTS_PRODUITS_KEYS.all, "detail"],
  detail: (id, filters = {}) => [
    ...COMMANDES_LOTS_PRODUITS_KEYS.details(),
    id,
    filters,
  ],
  compteur: ["madtx-compteur-commandes-lots-produits"],
};

// Recuperation un a un commandes lots produits dans caches.
export function useCommandesLotsProduitsUnAUn(
  idsToFetch,
  roles = [],
  account = ""
) {
  return useQueries({
    queries: idsToFetch.map((id) => ({
      // Si exportateur ou transporteur, utiliser un queryKey specifique.
      queryKey: hasRole(roles, 6)
        ? COMMANDES_LOTS_PRODUITS_KEYS.detail(id, { exportateur: account })
        : hasRole(roles, 5)
        ? COMMANDES_LOTS_PRODUITS_KEYS.detail(id, { transporteur: account })
        : COMMANDES_LOTS_PRODUITS_KEYS.detail(id),
      queryFn: async () => await getCommandeLotProduitEnrichi(id, roles, account),
      enabled: !!idsToFetch,
    })),
  });
}

// Recuperer tab des ids de commandes recoltes
export function useCommandesLotsProduitsIDs() {
  return useQuery({
    queryKey: COMMANDES_LOTS_PRODUITS_KEYS.compteur,
    queryFn: async () => {
      // Tab de tous les ids recoltes
      const compteurCommandes = Number(
        await collecteurExportateurRead.read("getCompteurCommande")
      );
      const commandesIDs = Array.from(
        { length: compteurCommandes - DEBUT_COMMANDE_LOT_PRODUIT + 1 },
        (_, i) => compteurCommandes - i
      );
      return commandesIDs;
    },
  });
}
