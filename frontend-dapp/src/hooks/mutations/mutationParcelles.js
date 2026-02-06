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
    mutationFn: async (args) => await createParcelle(...args),

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
        error.response?.data?.message || "Erreur lors de la création parcelle";
      alert(message);
      console.error("Create parcelle error:", error);
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
        error.response?.data?.message || "Erreur lors de l'ajout d'intrant parcelle";
      alert(message);
      console.error("Add intrant parcelle error:", error);
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
        error.response?.data?.message || "Erreur lors de l'ajout de photo parcelle";
      alert(message);
      console.error("Add photo parcelle error:", error);
    },
  });
}
