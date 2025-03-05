import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { getContract, executeContractMethod } from "../utils/contract";

function ValiderProduit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [produit, setProduit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const chargerProduit = async () => {
      try {
        const contract = await getContract();
        const produitInfo = await contract.produits(id);
        setProduit({
          nom: produitInfo.nom,
          quantite: produitInfo.quantite.toString(),
          prix: ethers.formatEther(produitInfo.prix),
          idParcelle: produitInfo.idParcelle.toString(),
          statut: Number(produitInfo.statut)
        });
      } catch (error) {
        console.error("Erreur lors du chargement du produit:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      chargerProduit();
    }
  }, [id]);

  const handleValidation = async (estValide) => {
    setIsProcessing(true);

    try {
      const contract = await getContract();
      
      await executeContractMethod(
        contract.validerProduit,
        id,
        estValide
      );

      alert(estValide ? "Produit validé avec succès !" : "Produit refusé.");
      navigate("/liste-produits");
    } catch (error) {
      console.error("Erreur lors de la validation:", error);
      alert("Erreur lors de la validation: " + error.message);
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
        <h2 className="text-xl font-semibold mb-4">Valider le produit</h2>
        <div className="mb-6">
          <h3 className="font-semibold">Détails du produit :</h3>
          <p>Nom: {produit.nom}</p>
          <p>Quantité: {produit.quantite}</p>
          <p>Prix: {produit.prix} ETH</p>
          <p>ID Parcelle: {produit.idParcelle}</p>
        </div>
        <div className="space-x-4">
          <button
            onClick={() => handleValidation(true)}
            disabled={isProcessing}
            className={`px-4 py-2 text-white rounded-lg transition-colors ${
              isProcessing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isProcessing ? "Traitement..." : "Valider"}
          </button>
          <button
            onClick={() => handleValidation(false)}
            disabled={isProcessing}
            className={`px-4 py-2 text-white rounded-lg transition-colors ${
              isProcessing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {isProcessing ? "Traitement..." : "Refuser"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ValiderProduit; 