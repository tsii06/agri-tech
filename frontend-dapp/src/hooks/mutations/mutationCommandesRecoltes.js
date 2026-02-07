import { useMutation, useQueryClient } from "@tanstack/react-query";
import { COMMANDES_RECOLTES_KEYS } from "../queries/useCommandesRecoltes";
import { getCollecteurProducteurWrite } from "../../config/onChain/frontContracts";

// A la modification de prix d'une commande recotle
export function useChoixTransporteurCommandeRecolte() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args) => {
      const contract = await getCollecteurProducteurWrite();
      await contract.write("choisirTransporteurCommandeRecolte", [
        args.id,
        args.addrTransporteur,
      ]);
      return { idRecolte: args.id };
    },

    onSuccess: (receipt) => {
      // Refetch la recoltes concernee.
      queryClient.invalidateQueries({
        queryKey: COMMANDES_RECOLTES_KEYS.detail(receipt.idRecolte),
      });

      console.log("✅ Transaction confirmée");
    },

    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Erreur lors du choix transporteur commande recolte";
      alert(message);
      console.error("Choix transporteur commande recolte error:", error);
    },
  });
}

// A l'enregistrement condition transport commande recolte
export function useConditionTransportCommandeRecolte() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args) => {
      const contract = await getCollecteurProducteurWrite();
      const res = await contract.write("enregistrerCondition", [
        args.id,
        args.cid,
      ]);
      return { ...res, idCommandeRecolte: args.id };
    },

    onSuccess: (receipt) => {
      // Refetch la recoltes concernee.
      queryClient.invalidateQueries({
        queryKey: COMMANDES_RECOLTES_KEYS.detail(receipt.idCommandeRecolte),
      });

      console.log("✅ Transaction confirmée");
    },

    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Erreur lors de l'enregistrement condition transport commande recolte";
      alert(message);
      console.error("Enregistrement condition transport commande recolte error:", error);
    },
  });
}
