import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { getContract, executeContractMethod } from "../utils/contract";

function EffectuerPaiement() {
  const { id } = useParams(); // id de la commande
  const navigate = useNavigate();
  const [commande, setCommande] = useState(null);
  const [produit, setProduit] = useState(null);
  const [montant, setMontant] = useState("");
  const [modePaiement, setModePaiement] = useState("0"); // 0 pour ETH, 1 pour autre
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const chargerDetails = async () => {
      try {
        const contract = await getContract();
        const commandeInfo = await contract.commandes(id);
        setCommande({
          idProduit: commandeInfo.idProduit.toString(),
          quantite: commandeInfo.quantite.toString(),
          exportateur: commandeInfo.exportateur,
          statutTransport: Number(commandeInfo.statutTransport)
        });

        const produitInfo = await contract.produits(commandeInfo.idProduit);
        setProduit({
          nom: produitInfo.nom,
          prix: ethers.formatEther(produitInfo.prix)
        });

        // Calculer le montant total par défaut
        const prixTotal = Number(produitInfo.prix) * Number(commandeInfo.quantite);
        setMontant(ethers.formatEther(prixTotal.toString()));
      } catch (error) {
        console.error("Erreur lors du chargement des détails:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      chargerDetails();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const contract = await getContract();
      const montantEnWei = ethers.parseEther(montant);
      
      await executeContractMethod(
        contract.effectuerPaiement,
        id,
        montantEnWei,
        Number(modePaiement),
        {
          value: modePaiement === "0" ? montantEnWei : 0
        }
      );

      alert("Paiement effectué avec succès !");
      navigate("/liste-commandes");
    } catch (error) {
      console.error("Erreur lors du paiement:", error);
      alert("Erreur lors du paiement: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Effectuer le paiement</h2>
        <div className="mb-6">
          <h3 className="font-semibold">Détails de la commande :</h3>
          <p>Produit: {produit.nom}</p>
          <p>Quantité: {commande.quantite}</p>
          <p>Prix unitaire: {produit.prix} ETH</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Montant à payer (ETH)
            </label>
            <input
              type="number"
              step="0.000001"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mode de paiement
            </label>
            <select
              value={modePaiement}
              onChange={(e) => setModePaiement(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="0">ETH</option>
              <option value="1">Autre</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isProcessing}
            className={`w-full px-4 py-2 text-white rounded-lg transition-colors ${
              isProcessing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isProcessing ? "Traitement en cours..." : "Effectuer le paiement"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EffectuerPaiement; 