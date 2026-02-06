import { useQuery } from "@tanstack/react-query";
import { getAllCommandesRecoltes } from "../../utils/contrat/collecteurProducteur";

export const COMMANDES_RECOLTES_KEYS = {
  all: ["madtx-recoltes"],
  lists: () => [...COMMANDES_RECOLTES_KEYS.all, "list"],
  list: (filters) => [...COMMANDES_RECOLTES_KEYS.lists(), filters],
  details: () => [...COMMANDES_RECOLTES_KEYS.all, "detail"],
  detail: (id) => [...COMMANDES_RECOLTES_KEYS.details(), id],
};

// Recuperer tous les parcelles d'un producteur dans le cache
export function useCommandesRecoltesCollecteur(roles, account) {
  return useQuery({
    queryKey: COMMANDES_RECOLTES_KEYS.list({ collecteur: account }),
    queryFn: async () => await getAllCommandesRecoltes(roles, account),
    // Gestion d'erreur custom
    throwOnError: false, // Pas de throw, géré localement
  });
}