import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { getCollecteurExportateurContract } from "../../utils/contract";
import { getRoleName } from "../../components/Layout/Header";

function CommandeExportateur() {
  const navigate = useNavigate();
  const [produits, setProduits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acteur, setActeur] = useState({});
  const [_, setState] = useState({});
  const [quantiteCommande, setQuantiteCommande] = useState("");
  const [produitSelectionne, setProduitSelectionne] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const chargerProduits = async () => {
      try {
        const contract = await getCollecteurExportateurContract();
        const provider = contract.runner.provider;
        const signer = await provider.getSigner();
        const account = await signer.getAddress();

        console.log("Adresse connectée:", account);

        // Obtenir le nombre total de produits
        const compteurProduits = await contract.compteurProduits();
        console.log("Nombre total de produits:", compteurProduits.toString());
        
        // Charger tous les produits
        const produitsTemp = [];
        for (let i = 1; i <= compteurProduits; i++) {
          const produit = await contract.getProduit(i);
          
          // Vérifier que le produit est validé
          if (produit.statut === 1) { // 1 = Valide
            produitsTemp.push({
              id: i,
              idRecolte: produit.idRecolte.toString(),
              nom: produit.nom,
              quantite: produit.quantite.toString(),
              prixUnit: produit.prixUnit.toString(),
              statut: produit.statut,
              dateRecolte: produit.dateRecolte,
              certificatPhytosanitaire: produit.certificatPhytosanitaire,
              collecteur: produit.collecteur.toString()
            });
          }
        }
        
        console.log("Produits trouvés:", produitsTemp);
        setActeur(acteur);
        // Inverser le tri des produits pour que les plus récentes soient en premier
        produitsTemp.reverse();
        setProduits(produitsTemp);
      } catch (error) {
        console.error("Erreur lors du chargement des produits:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    chargerProduits();
  }, [_]);

  const handleCommander = async (produitId) => {
    try {
      const contract = await getCollecteurExportateurContract();
      const produit = produits.find(p => p.id === produitId);
      
      // Vérifier que la quantité est valide
      const quantite = Number(quantiteCommande);
      if (isNaN(quantite) || quantite <= 0) {
        setError("Veuillez entrer une quantité valide");
        return;
      }
      
      if (quantite > Number(produit.quantite)) {
        setError("La quantité demandée est supérieure à la quantité disponible");
        return;
      }
      
      // Passer la commande
      const tx = await contract.passerCommande(
        produitId,
        quantite
      );
      await tx.wait();
      
      // Rediriger vers la page des commandes
      navigate('/mes-commandes');
    } catch (error) {
      console.error("Erreur lors de la commande:", error);
      setError(error.message);
    }
  };

  const getStatutProduit = (statut) => {
    switch(statut) {
      case 0: return "En attente";
      case 1: return "Validé";
      case 2: return "Rejeté";
      default: return "Inconnu";
    }
  };

  const getStatutProduitColor = (statut) => {
    switch(statut) {
      case 0: return "text-warning";
      case 1: return "text-success";
      case 2: return "text-danger";
      default: return "text-secondary";
    }
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center text-red-600">
            Erreur lors du chargement des produits: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="card p-4 shadow-sm">
        <h2 className="h5 mb-3">Liste des Produits</h2>
        
        {isLoading ? (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        ) : produits.length === 0 ? (
          <div className="text-center text-muted">
            Aucun produit validé n'est disponible pour le moment.
          </div>
        ) : (
          <div className="row g-3">
            {produits.map((produit) => (
              <div key={produit.id} className="col-md-4">
                <div className="card border shadow-sm p-3">
                  <h5 className="card-title">{produit.nom}</h5>
                  <div className="card-text small">
                    <p><strong>ID Récolte:</strong> {produit.idRecolte}</p>
                    <p><strong>Quantité disponible:</strong> {produit.quantite} kg</p>
                    <p><strong>Prix unitaire:</strong> {produit.prixUnit} MADATX</p>
                    <p><strong>Date de récolte:</strong> {produit.dateRecolte}</p>
                    <p><strong>Certificat phytosanitaire:</strong> {produit.certificatPhytosanitaire}</p>
                    <p><strong>Collecteur:</strong> {produit.collecteur.slice(0, 6)}...{produit.collecteur.slice(-4)}</p>
                    <p className={`fw-semibold ${getStatutProduitColor(produit.statut)}`}>
                      <strong>Statut:</strong> {getStatutProduit(produit.statut)}
                    </p>
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        setProduitSelectionne(produit);
                        setShowModal(true);
                      }}
                      className="btn btn-sm btn-primary"
                    >
                      Commander
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de commande */}
      {showModal && produitSelectionne && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Commander {produitSelectionne.nom}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Quantité disponible: {produitSelectionne.quantite} kg</label>
                  <input
                    type="number"
                    className="form-control"
                    value={quantiteCommande}
                    onChange={(e) => setQuantiteCommande(e.target.value)}
                    placeholder="Quantité à commander"
                  />
                </div>
                <div className="mb-3">
                  <p>Prix unitaire: {produitSelectionne.prixUnit} MADATX</p>
                  <p>Total: {Number(quantiteCommande) * Number(produitSelectionne.prixUnit)} MADATX</p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleCommander(produitSelectionne.id)}
                >
                  Confirmer la commande
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommandeExportateur; 