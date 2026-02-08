import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createParcelle } from "../../utils/contrat/producteur";
import { PARCELLES_KEYS } from "../queries/useParcelles";
import {
  addIntrantToParcelleMaster,
  updateCidParcelle,
} from "../../utils/ipfsUtils";

// A la creation d'une parcelle
export function useCreateParcelle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args) => await createParcelle(...args),

    onSuccess: (receipt) => {
      // Refetch le compteur parcelles car ajout d'une nouvelle.
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: PARCELLES_KEYS.compteur });
      }, 3000);

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
export function useAddIntantParcelle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args) => {
      await addIntrantToParcelleMaster(
        args.parcelle,
        args.intrant,
        args.dateAjoutISO
      );
      return { id: args.parcelle.id };
    },

    onSuccess: (receipt) => {
      // Refetch la cache du parcelle concernee
      queryClient.invalidateQueries({
        queryKey: PARCELLES_KEYS.detail(Number(receipt.id)),
      });

      console.log("✅ Transaction confirmée:");
    },

    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Erreur lors de l'ajout d'intrant parcelle";
      alert(message);
      console.error("Add intrant parcelle error:", error);
    },
  });
}

// A l'ajout d'inspection d'une parcelle
export function useAddInspectionParcelle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args) => {
      await updateCidParcelle(args.parcelle, args.newData, args.type);
      return { id: args.parcelle.id };
    },

    onSuccess: (receipt) => {
      // Refetch la cache de la parcelle concernee
      console.log("ID parcelle inpecter : ", receipt.id);
      queryClient.invalidateQueries({ queryKey: PARCELLES_KEYS.detail(Number(receipt.id)) });

      console.log("✅ Transaction confirmée:");
    },

    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Erreur lors de l'ajout de inspection parcelle";
      alert(message);
      console.error("Add inspection parcelle error:", error);
    },
  });
}

// A l'ajout de photo d'une parcelle
export function useAddPhotoParcelle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args) =>{
      
      await updateCidParcelle(args.parcelle, args.newData, args.type);
      return { id: args.parcelle.id };
    },

    onSuccess: (receipt) => {
      // Refetch la cache de la parcelle concernee
      queryClient.invalidateQueries({ queryKey: PARCELLES_KEYS.detail(Number(receipt.id)) });

      console.log("✅ Transaction confirmée:");
    },

    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Erreur lors de l'ajout de photo parcelle";
      alert(message);
      console.error("Add photo parcelle error:", error);
    },
  });
}
