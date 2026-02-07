import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getCollecteurExportateurWrite } from "../../config/onChain/frontContracts";
import { PRODUITS_KEYS } from "../queries/useProduits";
import { LOTS_PRODUITS_KEYS } from "../queries/useLotsProduits";

// A l'enregistrement de produit en lot produit
export function useEnregistrementProduit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args) => {
      const contract = await getCollecteurExportateurWrite();
      const res = await contract.write("ajouterLotProduit", [
        args.produitsIDs,
        args.cid,
        args.prix,
      ]);
      return { ...res, produitsIDs: args.produitsIDs };
    },

    onSuccess: async (receipt) => {
      // Refetch les produits concernee.
      receipt.produitsIDs.forEach((id) => {
        queryClient.invalidateQueries({
          queryKey: PRODUITS_KEYS.detail(id),
        });
      });
      // apres enregistrement il y a ajoute de nouveau lot produits
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: LOTS_PRODUITS_KEYS.compteur,
        });
      }, 3000);

      console.log("✅ Transaction confirmée");
    },

    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Erreur lors de l'enregistrement condition transport commande recolte";
      alert(message);
      console.error(
        "Enregistrement condition transport commande recolte error:",
        error
      );
    },
  });
}
