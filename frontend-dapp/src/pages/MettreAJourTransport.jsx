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
    <div className="container py-4">
      <div className="card p-4 shadow-sm">
        <h2 className="h5 mb-3">Mettre à jour le statut de transport</h2>
        <div className="mb-3">
          <h5 className="fw-semibold">Détails de la commande :</h5>
          <p><strong>Produit:</strong> {produit.nom}</p>
          <p><strong>Quantité:</strong> {commande.quantite}</p>
          <p><strong>Statut actuel:</strong> {getStatutTransportLabel(commande.statutTransport)}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Nouveau statut</label>
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              className="form-select"
            >
              <option value="0">En attente</option>
              <option value="1">En cours</option>
              <option value="2">Livré</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isProcessing || statut === commande.statutTransport.toString()}
            className={`btn w-100 ${isProcessing || statut === commande.statutTransport.toString() ? "btn-secondary disabled" : "btn-primary"}`}
          >
            {isProcessing ? "Mise à jour..." : "Mettre à jour le statut"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default MettreAJourTransport; 