import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getGestionnaireActeursWrite } from "../../config/onChain/frontContracts";
import { ACTEURS_KEYS } from "../queries/useActeurs";

// A la mdoification d'un acteurs
export function useUpdateActeur() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args) => {
      const contract = await getGestionnaireActeursWrite();
      await contract.write("modifierActeur", [
        args.adresse,
        args.nom,
        args.nifOuCin,
        args.adresseOfficielle,
        args.email,
        args.telephone,
      ]);
      return { address: args.adresse };
    },

    onSuccess: (receipt) => {
      // Refetch la cache de l'acteur concernee
      queryClient.invalidateQueries({
        queryKey: ACTEURS_KEYS.detail(receipt.address),
      });

      console.log("✅ Transaction confirmée:");
    },

    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Erreur lors de la modification acteur";
      alert(message);
      console.error("Modification acteur error:", error);
    },
  });
}

// A la creation d'un acteurs
export function useCreateActeur() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args) => {
      const contract = await getGestionnaireActeursWrite();
      await contract.write("enregistrerActeur", [
        args.adresse,
        args.role,
        args.typeEntite,
        args.nom,
        args.nifOuCin,
        args.adresseOfficielle,
        args.email,
        args.telephone
      ]);
    },

    onSuccess: () => {
      // Refetch la cache de adresse acteurs
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ACTEURS_KEYS.address(),
        });
      }, 3000);

      console.log("✅ Transaction confirmée:");
    },

    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Erreur lors de la modification acteur";
      alert(message);
      console.error("Modification acteur error:", error);
    },
  });
}
