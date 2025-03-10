import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { getContract, executeContractMethod } from "../utils/contract";

function EnregistrerCondition() {
  const { id } = useParams(); // id du produit
  const navigate = useNavigate();
  const [produit, setProduit] = useState(null);
  const [temperature, setTemperature] = useState("");
  const [humidite, setHumidite] = useState("");
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
          idParcelle: produitInfo.idParcelle.toString()
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
        contract.enregistrerCondition,
        id,
        temperature,
        humidite
      );

      alert("Conditions enregistrées avec succès !");
      navigate("/liste-produits");
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      alert("Erreur lors de l'enregistrement: " + error.message);
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
        <h2 className="h5 mb-3">Enregistrer les conditions de transport</h2>
        <div className="mb-3">
          <h5 className="fw-semibold">Détails du produit :</h5>
          <p><strong>Nom:</strong> {produit.nom}</p>
          <p><strong>Quantité:</strong> {produit.quantite}</p>
          <p><strong>ID Parcelle:</strong> {produit.idParcelle}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Température</label>
            <input
              type="text"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              placeholder="Ex: 20°C"
              className="form-control"
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Humidité</label>
            <input
              type="text"
              value={humidite}
              onChange={(e) => setHumidite(e.target.value)}
              placeholder="Ex: 65%"
              className="form-control"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isProcessing}
            className={`btn w-100 ${isProcessing ? "btn-secondary disabled" : "btn-primary"}`}
          >
            {isProcessing ? "Enregistrement..." : "Enregistrer les conditions"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EnregistrerCondition; 