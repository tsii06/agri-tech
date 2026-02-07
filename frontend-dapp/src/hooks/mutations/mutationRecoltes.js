import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RECOLTES_KEYS } from "../queries/useRecoltes";
import { createRecolte } from "../../utils/contrat/collecteurProducteur";
import { getCollecteurProducteurWrite } from "../../config/onChain/frontContracts";
import { COMMANDES_RECOLTES_KEYS } from "../queries/useCommandesRecoltes";

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
export function useUpdatePrixRecolte() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args) => {
      const contract = await getCollecteurProducteurWrite();
      await contract.write("modifierPrixRecolte", [args.id, args.prix]);
      return { idRecolte: args.id };
    },

    onSuccess: (receipt) => {
      // Refetch la recoltes concernee.
      queryClient.invalidateQueries({
        queryKey: RECOLTES_KEYS.detail(receipt.idRecolte),
      });

      console.log("✅ Transaction confirmée");
    },

    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Erreur lors de la modification prix recolte";
      alert(message);
      console.error("Modification prix recolte error:", error);
    },
  });
}

// A la certification d'une recolte
export function useCertificateRecolte() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args) => {
      const collecteurProducteurContract = await getCollecteurProducteurWrite();
      await collecteurProducteurContract.write("certifieRecolte", [
        args.id,
        args.cid,
      ]);
      return { idRecolte: args.id };
    },

    onSuccess: (receipt) => {
      // Refetch la recolte concernee.
      queryClient.invalidateQueries({
        queryKey: RECOLTES_KEYS.detail(receipt.idRecolte),
      });

      console.log("✅ Transaction confirmée");
    },

    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Erreur lors de la certification recolte";
      alert(message);
      console.error("Certificate recolte error:", error);
    },
  });
}

// A la commeande d'une recotle
export function useCommandeRecolte() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args) => {
      const contract = await getCollecteurProducteurWrite();
      await contract.write("passerCommandeVersProducteur", [
        args.id,
        args.quantite,
      ]);
      return { idRecolte: args.id };
    },

    onSuccess: (receipt) => {
      // Refetch la recolte concernee.
      queryClient.invalidateQueries({
        queryKey: RECOLTES_KEYS.detail(receipt.idRecolte),
      });

      // Il y a creation d'une commandes recoltes apres
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: COMMANDES_RECOLTES_KEYS.compteur,
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
