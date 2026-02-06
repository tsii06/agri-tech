import { useQuery } from "@tanstack/react-query";
import { getAllExpeditions } from "../../utils/contrat/exportateurClient";

export const EXPEDITIONS_KEYS = {
  all: ["madtx-expeditions"],
  lists: () => [...EXPEDITIONS_KEYS.all, "list"],
  list: (filters) => [...EXPEDITIONS_KEYS.lists(), filters],
  details: () => [...EXPEDITIONS_KEYS.all, "detail"],
  detail: (id) => [...EXPEDITIONS_KEYS.details(), id],
};

// Recuperer tous les expeditions dans le cache
export function useExpeditions() {
  return useQuery({
    queryKey: EXPEDITIONS_KEYS.lists(),
    queryFn: async () => await getAllExpeditions(),
    // Gestion d'erreur custom
    throwOnError: false, // Pas de throw, géré localement
  });
}

// Recuperer tous les parcelles d'un producteur dans le cache
export function useExpeditionsExportateur(account) {
  return useQuery({
    queryKey: EXPEDITIONS_KEYS.list({ exportateur: account }),
    queryFn: async () => {},
    // Gestion d'erreur custom
    throwOnError: false, // Pas de throw, géré localement
  });
}
