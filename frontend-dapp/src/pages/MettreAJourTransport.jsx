import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { getContract, executeContractMethod } from "../utils/contract";

function MettreAJourTransport() {
  const { id } = useParams(); // id de la commande
  const navigate = useNavigate();
  const [commande, setCommande] = useState(null);
  const [produit, setProduit] = useState(null);
  const [statut, setStatut] = useState("0");
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
          quantite: produitInfo.quantite.toString()
        });
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

  const getStatutTransportLabel = (statutCode) => {
    switch(statutCode) {
      case 0: return "En attente";
      case 1: return "En cours";
      case 2: return "Livré";
      default: return "Inconnu";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const contract = await getContract();
      
      await executeContractMethod(
        contract.mettreAJourStatutTransport,
        id,
        Number(statut)
      );

      alert("Statut de transport mis à jour avec succès !");
      navigate("/liste-commandes");
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      alert("Erreur lors de la mise à jour: " + error.message);
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
        <h2 className="text-xl font-semibold mb-4">Mettre à jour le statut de transport</h2>
        <div className="mb-6">
          <h3 className="font-semibold">Détails de la commande :</h3>
          <p>Produit: {produit.nom}</p>
          <p>Quantité: {commande.quantite}</p>
          <p>Statut actuel: {getStatutTransportLabel(commande.statutTransport)}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nouveau statut
            </label>
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="0">En attente</option>
              <option value="1">En cours</option>
              <option value="2">Livré</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isProcessing || statut === commande.statutTransport.toString()}
            className={`w-full px-4 py-2 text-white rounded-lg transition-colors ${
              isProcessing || statut === commande.statutTransport.toString()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isProcessing ? "Mise à jour..." : "Mettre à jour le statut"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default MettreAJourTransport; 