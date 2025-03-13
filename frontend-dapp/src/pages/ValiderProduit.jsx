import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { getCollecteurContract, executeContractMethod } from "../utils/contract";

function ValiderProduit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [produit, setProduit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const chargerProduit = async () => {
      try {
        const contract = await getCollecteurContract();
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
      const contract = await getCollecteurContract();
      
      const tx = await executeContractMethod(
        contract,
        contract.validerProduit,
        id,
        estValide
      );
      await tx.wait();

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
    <div className="container py-4">
      <div className="card p-4 shadow-sm">
        <h2 className="h5 mb-3">Valider le produit</h2>
        <div className="mb-3">
          <h5 className="fw-semibold">Détails du produit :</h5>
          <p><strong>Nom:</strong> {produit.nom}</p>
          <p><strong>Quantité:</strong> {produit.quantite}</p>
          <p><strong>Prix:</strong> {produit.prix} ETH</p>
          <p><strong>ID Parcelle:</strong> {produit.idParcelle}</p>
        </div>
        <div className="d-flex gap-2">
          <button
            onClick={() => handleValidation(true)}
            disabled={isProcessing}
            className={`btn ${isProcessing ? "btn-secondary disabled" : "btn-success"}`}
          >
            {isProcessing ? "Traitement..." : "Valider"}
          </button>
          <button
            onClick={() => handleValidation(false)}
            disabled={isProcessing}
            className={`btn ${isProcessing ? "btn-secondary disabled" : "btn-danger"}`}
          >
            {isProcessing ? "Traitement..." : "Refuser"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ValiderProduit; 