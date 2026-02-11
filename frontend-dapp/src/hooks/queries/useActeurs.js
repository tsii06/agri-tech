import { useQueries, useQuery } from "@tanstack/react-query";
import { getActeur, ROLES } from "../../utils/contrat/gestionnaireActeurs";
import { gestionnaireActeursRead } from "../../config/onChain/frontContracts";

export const ACTEURS_KEYS = {
  all: ["madtx-acteurs"],
  lists: () => [...ACTEURS_KEYS.all, "list"],
  list: (filters) => [...ACTEURS_KEYS.lists(), filters],
  details: () => [...ACTEURS_KEYS.all, "detail"],
  detail: (addr, filters = {}) => [...ACTEURS_KEYS.details(), addr, filters],
  address: (filters = {}) => ["madtx-address-acteurs", filters],
};

// Recuperation un a un acteurs by roles dans caches.
export function useActeursByRole(tabAddr, role) {
  return useQueries({
    queries:
      tabAddr?.map((addr) => ({
        queryKey: ACTEURS_KEYS.detail({ role: role }, addr),
        queryFn: async () => await getActeur(addr),
        enabled: !!tabAddr,
      })) ?? [],
  });
}

// Recuperation un a un acteurs dans caches.
export function useActeursUnAUn(tabAddr) {
  return useQueries({
    queries:
      tabAddr?.map((addr) => ({
        queryKey: ACTEURS_KEYS.detail(addr),
        queryFn: async () => await getActeur(addr),
        enabled: !!tabAddr,
      })) ?? [],
  });
}

// Recuperer les addresses acteurs by role
export function useAddressActeursByRole(role) {
  return useQuery({
    queryKey: ACTEURS_KEYS.address("", { role: role }),
    queryFn: async () =>
      await gestionnaireActeursRead.read("getActeursByRole", role),
    // Gestion d'erreur custom
    throwOnError: false, // Pas de throw, géré localement
  });
}

// Recuperer tous les addresses acteurs dans un tab
export function useAddressActeurs() {
  return useQuery({
    queryKey: ACTEURS_KEYS.address(),
    queryFn: async () => {
      let all = [];
      for (let role = 0; role < ROLES.length; role++) {
        const addresses = await gestionnaireActeursRead.read("getActeursByRole", role);
        all.push(...addresses);
      }
      // Eliminer les doublants
      return [...new Set(all)];
    },
    // Gestion d'erreur custom
    throwOnError: false, // Pas de throw, géré localement
  });
}
