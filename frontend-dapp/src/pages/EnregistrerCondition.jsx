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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Enregistrer les conditions de transport</h2>
        <div className="mb-6">
          <h3 className="font-semibold">Détails du produit :</h3>
          <p>Nom: {produit.nom}</p>
          <p>Quantité: {produit.quantite}</p>
          <p>ID Parcelle: {produit.idParcelle}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Température
            </label>
            <input
              type="text"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              placeholder="Ex: 20°C"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Humidité
            </label>
            <input
              type="text"
              value={humidite}
              onChange={(e) => setHumidite(e.target.value)}
              placeholder="Ex: 65%"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
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
            {isProcessing ? "Enregistrement..." : "Enregistrer les conditions"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EnregistrerCondition; 