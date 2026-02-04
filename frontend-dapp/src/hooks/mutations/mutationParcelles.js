import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createParcelle } from "../../utils/contrat/producteur";
import { PARCELLES_KEYS } from "../queries/useParcelles";
import {
  addIntrantToParcelleMaster,
  updateCidParcelle,
} from "../../utils/ipfsUtils";

// A la creation d'une parcelle
export function useCreateParcelle(account) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args) => createParcelle(...args),

    onSuccess: (receipt) => {
      // Refetch la cache pour la liste de tous les parcelles
      queryClient.invalidateQueries({ queryKey: PARCELLES_KEYS.lists() });
      // Refetch la cache pour la liste de tous les parcelles du producteur.
      queryClient.invalidateQueries({
        queryKey: PARCELLES_KEYS.list({ producteur: account }),
      });

      console.log("✅ Transaction confirmée:", receipt);

      alert("Parcelle créé !");
    },

    onError: (error) => {
      const message =
        error.response?.data?.message || "Erreur lors de la création";
      alert(message);
      console.error("Create user error:", error);
    },
  });
}

// A l'ajout d'intrant d'une parcelle
export function useAddIntantParcelle(account) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args) =>
      addIntrantToParcelleMaster(
        args.parcelle,
        args.intrant,
        args.dateAjoutISO
      ),

    onSuccess: (receipt) => {
      // Refetch la cache pour la liste de tous les parcelles
      queryClient.invalidateQueries({ queryKey: PARCELLES_KEYS.lists() });
      // Refetch la cache pour la liste de tous les parcelles du producteur.
      queryClient.invalidateQueries({
        queryKey: PARCELLES_KEYS.list({ producteur: account }),
      });

      console.log("✅ Transaction confirmée:", receipt);
    },

    onError: (error) => {
      const message =
        error.response?.data?.message || "Erreur lors de la création";
      alert(message);
      console.error("Create user error:", error);
    },
  });
}

// A l'ajout de photo d'une parcelle
export function useAddPhotoParcelle(account) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args) =>
      updateCidParcelle(args.parcelle, args.newData, args.type),

    onSuccess: (receipt) => {
      // Refetch la cache pour la liste de tous les parcelles
      queryClient.invalidateQueries({ queryKey: PARCELLES_KEYS.lists() });
      // Refetch la cache pour la liste de tous les parcelles du producteur.
      queryClient.invalidateQueries({
        queryKey: PARCELLES_KEYS.list({ producteur: account }),
      });

      console.log("✅ Transaction confirmée:", receipt);
    },

    onError: (error) => {
      const message =
        error.response?.data?.message || "Erreur lors de la création";
      alert(message);
      console.error("Create user error:", error);
    },
  });
}
