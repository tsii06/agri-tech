import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { getCollecteurContract, executeContractMethod } from "../utils/contract";

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
        const contract = await getCollecteurContract();
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
      const contract = await getCollecteurContract();
      const montantEnWei = ethers.parseEther(montant);
      
      const tx = await executeContractMethod(
        contract,
        contract.effectuerPaiement,
        id,
        montantEnWei,
        Number(modePaiement),
        {
          value: modePaiement === "0" ? montantEnWei : 0
        }
      );
      await tx.wait();

      alert("Paiement effectué avec succès !");
      navigate("/mes-commandes");
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
    <div className="container py-4">
      <div className="card p-4 shadow-sm">
        <h2 className="h5 mb-3">Effectuer le paiement</h2>
        <div className="mb-3">
          <h5 className="fw-semibold">Détails de la commande :</h5>
          <p><strong>Produit:</strong> {produit.nom}</p>
          <p><strong>Quantité:</strong> {commande.quantite}</p>
          <p><strong>Prix unitaire:</strong> {produit.prix} ETH</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Montant à payer (ETH)</label>
            <input
              type="number"
              step="0.000001"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              className="form-control"
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Mode de paiement</label>
            <select
              value={modePaiement}
              onChange={(e) => setModePaiement(e.target.value)}
              className="form-select"
            >
              <option value="0">ETH</option>
              <option value="1">Autre</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isProcessing}
            className={`btn w-100 ${isProcessing ? "btn-secondary disabled" : "btn-primary"}`}
          >
            {isProcessing ? "Traitement en cours..." : "Effectuer le paiement"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EffectuerPaiement; 