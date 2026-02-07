import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getCollecteurExportateurWrite } from "../../config/onChain/frontContracts";
import { COMMANDES_LOTS_PRODUITS_KEYS } from "../queries/useCommandesLotsProduits";

// Au choix de transporteur pour commande lot produit
export function useChoixTransporteurCommandeLotProduit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args) => {
      const contract = await getCollecteurExportateurWrite();
      await contract.write("choisirTransporteurCommandeProduit", [
        args.id,
        args.addrTransporteur,
      ]);
      return { idCommande: args.id };
    },

    onSuccess: (receipt) => {
      // Refetch la recoltes concernee.
      queryClient.invalidateQueries({
        queryKey: COMMANDES_LOTS_PRODUITS_KEYS.detail(receipt.idCommande),
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

// A l'enregistrement condition transport commande lot produit
export function useConditionTransportCommandeLotProduit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args) => {
      const contract = await getCollecteurExportateurWrite();
      const res = await contract.write("enregistrerCondition", [
        args.id,
        args.cid,
      ]);
      return { ...res, idCommande: args.id };
    },

    onSuccess: (receipt) => {
      // Refetch la recoltes concernee.
      queryClient.invalidateQueries({
        queryKey: COMMANDES_LOTS_PRODUITS_KEYS.detail(receipt.idCommande),
      });

      console.log("✅ Transaction confirmée");
    },

    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Erreur lors de l'enregistrement condition transport commande lot produit";
      alert(message);
      console.error(
        "Enregistrement condition transport commande lot produit error:",
        error
      );
    },
  });
}

// // A l'enregistrement condition transport commande lot produit
export function useUpdateStatusTransportCommandeLotProduit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args) => {
      const contract = await getCollecteurExportateurWrite();
      const res = await contract.write("mettreAJourStatutTransport", [
        args.id,
        args.status,
      ]);
      return { ...res, idCommandeRecolte: args.id };
    },

    onSuccess: (receipt) => {
      // Refetch la commande recoltes concernee.
      queryClient.invalidateQueries({
        queryKey: COMMANDES_LOTS_PRODUITS_KEYS.detail(
          receipt.idCommandeRecolte
        ),
      });

      console.log("✅ Transaction confirmée");
    },

    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Erreur lors du maj status transport commande lot produit";
      alert(message);
      console.error("Maj status transport commande lot produit error:", error);
    },
  });
}

// A l'enregistrement condition transport commande lot produit
export function useValiderCommandeLotProduit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args) => {
      const contract = await getCollecteurExportateurWrite();
      const res = await contract.write("mettreAJourStatutCommande", [
        args.id,
        args.validate,
      ]);
      return { ...res, idCommande: args.id };
    },

    onSuccess: (receipt) => {
      // Refetch la commande recoltes concernee.
      queryClient.invalidateQueries({
        queryKey: COMMANDES_LOTS_PRODUITS_KEYS.detail(receipt.idCommande),
      });

      console.log("✅ Transaction confirmée");
    },

    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Erreur lors de la validation commande lot produit";
      alert(message);
      console.error("Validation commande lot produit error:", error);
    },
  });
}

// A l'enregistrement condition transport commande lot produit
export function usePayerCommandeLotProduit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args) => {
      const contract = await getCollecteurExportateurWrite();
      const res = await contract.write(
        "effectuerPaiement",
        [args.id, args.prix, args.modePaiement],
        args.options
      );
      return { ...res, idCommande: args.id };
    },

    onSuccess: (receipt) => {
      // Refetch la commande lot produit concernee.
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: COMMANDES_LOTS_PRODUITS_KEYS.detail(receipt.idCommande),
        });
      }, 3000);

      console.log("✅ Transaction confirmée");
    },

    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Erreur lors du paiement commande lot produit";
      alert(message);
      console.error("Paiement commande lot produit error:", error);
    },
  });
}
