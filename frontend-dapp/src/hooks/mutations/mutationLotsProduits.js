import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getCollecteurExportateurWrite } from "../../config/onChain/frontContracts";
import { LOTS_PRODUITS_KEYS } from "../queries/useLotsProduits";
import { COMMANDES_LOTS_PRODUITS_KEYS } from "../queries/useCommandesLotsProduits";

// A la modification de prix d'une recotle
export function useUpdatePrixLotProduit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args) => {
      const contract = await getCollecteurExportateurWrite();
      await contract.write("setPriceProduit", [args.id, args.prix]);
      return { id: args.id };
    },

    onSuccess: (receipt) => {
      // Refetch la lot produit concernee.
      queryClient.invalidateQueries({
        queryKey: LOTS_PRODUITS_KEYS.detail(receipt.id),
      });

      console.log("✅ Transaction confirmée");
    },

    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Erreur lors de la modification prix lot produit";
      alert(message);
      console.error("Modification prix lot produit error:", error);
    },
  });
}

// A la commeande d'un lot produit
export function useCommandeLotProduit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args) => {
      const contract = await getCollecteurExportateurWrite();
      await contract.write("passerCommande", [args.id, args.quantite]);
      return { idCommandeLotProduit: args.id };
    },

    onSuccess: (receipt) => {
      // Refetch la recolte concernee.
      queryClient.invalidateQueries({
        queryKey: LOTS_PRODUITS_KEYS.detail(receipt.idCommandeLotProduit),
      });

      // Il y a creatin de nouveau commande lot produit. Attendre 3s pour que la blockchain se met a jour.
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: COMMANDES_LOTS_PRODUITS_KEYS.compteur,
        });
      }, 3000);

      console.log("✅ Transaction confirmée");
    },

    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Erreur lors de la commande d'une recolte";
      alert(message);
      console.error("Passer commande recolte error:", error);
    },
  });
}
