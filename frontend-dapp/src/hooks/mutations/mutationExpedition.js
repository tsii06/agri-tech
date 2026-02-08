import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EXPEDITIONS_KEYS } from "../queries/useExpeditions";
import { getExportateurClientWrite } from "../../config/onChain/frontContracts";

// A la certification d'une expedition
export function useCertificateExpedition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args) => {
      const exportateurClientContrat = await getExportateurClientWrite();
      const tx = await exportateurClientContrat.write("certifierExpedition", [
        args.id,
        args.cid,
      ]);
      return { ...tx, id: Number(args.id)};
    },

    onSuccess: (receipt) => {
      // Refetch la cache de l'expedition concernee
      queryClient.invalidateQueries({ queryKey: EXPEDITIONS_KEYS.detail(receipt.id) });

      console.log("✅ Transaction confirmée:", receipt);
    },

    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Erreur lors de la certification expedition";
      alert(message);
      console.error("Certificate expedition error:", error);
    },
  });
}
