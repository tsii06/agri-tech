import { useMutation, useQueryClient } from "@tanstack/react-query";
import { COMMANDES_RECOLTES_KEYS } from "../queries/useCommandesRecoltes";
import { getCollecteurProducteurWrite } from "../../config/onChain/frontContracts";
import { PRODUITS_KEYS } from "../queries/useProduits";

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
      return { idRecolte: Number(args.id) };
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
      return { ...res, idCommandeRecolte: Number(args.id) };
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
      console.error(
        "Enregistrement condition transport commande recolte error:",
        error
      );
    },
  });
}

// A l'enregistrement condition transport commande recolte
export function useUpdateStatusTransportCommandeRecolte() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args) => {
      const contract = await getCollecteurProducteurWrite();
      const res = await contract.write("mettreAJourStatutTransport", [
        args.id,
        args.status,
      ]);
      return { ...res, idCommandeRecolte: Number(args.id) };
    },

    onSuccess: (receipt) => {
      // Refetch la commande recoltes concernee.
      queryClient.invalidateQueries({
        queryKey: COMMANDES_RECOLTES_KEYS.detail(receipt.idCommandeRecolte),
      });

      console.log("✅ Transaction confirmée");
    },

    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Erreur lors du maj status transport commande recolte";
      alert(message);
      console.error("Maj status transport commande recolte error:", error);
    },
  });
}

// A l'enregistrement condition transport commande recolte
export function useValiderCommandeRecolte() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args) => {
      const contract = await getCollecteurProducteurWrite();
      const res = await contract.write("validerCommandeRecolte", [
        args.id,
        args.validate,
      ]);
      return { ...res, idCommandeRecolte: Number(args.id) };
    },

    onSuccess: (receipt) => {
      // Refetch la commande recoltes concernee.
      queryClient.invalidateQueries({
        queryKey: COMMANDES_RECOLTES_KEYS.detail(receipt.idCommandeRecolte),
      });

      console.log("✅ Transaction confirmée");
    },

    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Erreur lors de la validation commande recolte";
      alert(message);
      console.error("Validation commande recolte error:", error);
    },
  });
}

// A l'enregistrement condition transport commande recolte
export function usePayerCommandeRecolte() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args) => {
      const contract = await getCollecteurProducteurWrite();
      const res = await contract.write(
        "effectuerPaiementVersProducteur",
        [args.id, args.prix, args.modePaiement],
        args.options
      );
      return { ...res, idCommandeRecolte: Number(args.id) };
    },

    onSuccess: (receipt) => {
      // Refetch la commande recoltes concernee.
      queryClient.invalidateQueries({
        queryKey: COMMANDES_RECOLTES_KEYS.detail(receipt.idCommandeRecolte),
      });

      // Refetch nbr de produits du collecteur.
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: PRODUITS_KEYS.compteur,
        });
      }, 3000);

      console.log("✅ Transaction confirmée");
    },

    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Erreur lors du paiement commande recolte";
      alert(message);
      console.error("Paiement commande recolte error:", error);
    },
  });
}
