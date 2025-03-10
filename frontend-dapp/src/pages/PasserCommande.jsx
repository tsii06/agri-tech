import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { getContract, executeContractMethod } from "../utils/contract";

function PasserCommande() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [produit, setProduit] = useState(null);
  const [quantite, setQuantite] = useState("");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const contract = await getContract();
      
      await executeContractMethod(
        contract.passerCommande,
        id,
        quantite
      );

      alert("Commande passée avec succès !");
      navigate("/liste-produits");
    } catch (error) {
      console.error("Erreur lors de la commande:", error);
      alert("Erreur lors de la commande: " + error.message);
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
        <h2 className="h5 mb-3">Passer une commande</h2>
        <div className="mb-3">
          <h5 className="fw-semibold">Détails du produit :</h5>
          <p><strong>Nom:</strong> {produit.nom}</p>
          <p><strong>Quantité disponible:</strong> {produit.quantite}</p>
          <p><strong>Prix unitaire:</strong> {produit.prix} ETH</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Quantité à commander</label>
            <input
              type="number"
              value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
              min="1"
              max={produit.quantite}
              className="form-control"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isProcessing}
            className={`btn w-100 ${isProcessing ? "btn-secondary disabled" : "btn-primary"}`}
          >
            {isProcessing ? "Traitement en cours..." : "Passer la commande"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PasserCommande; 