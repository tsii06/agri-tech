import { useQueries, useQuery } from "@tanstack/react-query";
import { getActeur } from "../../utils/contrat/gestionnaireActeurs";
import { gestionnaireActeursRead } from "../../config/onChain/frontContracts";

export const ACTEURS_KEYS = {
  all: ["madtx-acteurs"],
  lists: () => [...ACTEURS_KEYS.all, "list"],
  list: (filters) => [...ACTEURS_KEYS.lists(), filters],
  details: () => [...ACTEURS_KEYS.all, "detail"],
  detail: (filters = {}, addr) => [...ACTEURS_KEYS.details(), filters, addr],
};

// Recuperation un a un recoltes dans caches.
export function useActeursByRole(tabAddr, role) {
  return useQueries({
    queries: tabAddr?.map((addr) => ({
      queryKey: ACTEURS_KEYS.detail({ role: role }, addr),
      queryFn: async () => await getActeur(addr),
      enabled: !!tabAddr,
    })) ?? [],
  });
}

// Recuperer les addresses acteurs by role
export function useAddressActeursByRole(role) {
  return useQuery({
    queryKey: ["madtx-address-acteurs", { role: role }],
    queryFn: async () =>
      await gestionnaireActeursRead.read("getActeursByRole", role),
    // Gestion d'erreur custom
    throwOnError: false, // Pas de throw, géré localement
  });
}
