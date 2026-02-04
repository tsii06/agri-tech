import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RECOLTES_KEYS } from "../queries/useRecoltes";
import { createRecolte } from "../../utils/contrat/collecteurProducteur";
import { getCollecteurProducteurWrite } from "../../config/onChain/frontContracts";

// A la creation d'une recotle
export function useCreateRecolte(account) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args) =>
      await createRecolte(args.recolteData, args.parcelle),

    onSuccess: (receipt) => {
      // Refetch la cache pour la liste de tous les parcelles
      queryClient.invalidateQueries({ queryKey: RECOLTES_KEYS.lists() });
      // Refetch la cache pour la liste de tous les parcelles du producteur.
      queryClient.invalidateQueries({
        queryKey: RECOLTES_KEYS.list({ producteur: account }),
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

// A la modification de prix d'une recotle
export function useUpdatePrixRecolte(account) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args) => {
      const contract = await getCollecteurProducteurWrite();
      await contract.write("modifierPrixRecolte", [
        args.id,
        args.prix
      ]);
    },

    onSuccess: (receipt) => {
      // Refetch la cache pour la liste de tous les parcelles
      queryClient.invalidateQueries({ queryKey: RECOLTES_KEYS.lists() });
      // Refetch la cache pour la liste de tous les parcelles du producteur.
      queryClient.invalidateQueries({
        queryKey: RECOLTES_KEYS.list({ producteur: account }),
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
