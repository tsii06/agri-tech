import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getCollecteurExportateurContract, getRoleOfAddress } from "../../utils/contract";
import { getRoleName } from "../../components/Layout/Header";
import { useParams } from "react-router-dom";

function ListeProduits() {
  const { address } = useParams();
  const [produits, setProduits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [_, setState] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [produitSelectionne, setProduitSelectionne] = useState(null);
  const [nouveauPrix, setNouveauPrix] = useState("");
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const chargerProduits = async () => {
      try {
        const contract = await getCollecteurExportateurContract();
        const provider = contract.runner.provider;
        const signer = await provider.getSigner();
        const account = await signer.getAddress();
        let role = userRole;
        let cible = address ? address.toLowerCase() : (account ? account.toLowerCase() : null);
        if (!role && !address && account) {
          role = await getRoleOfAddress(account);
          setUserRole(role);
        }
        // Obtenir le nombre total de produits
        const compteurProduits = await contract.getCompteurProduit();
        const produitsTemp = [];
        for (let i = 1; i <= compteurProduits; i++) {
          const produit = await contract.getProduit(i);
          if (cible && produit.collecteur.toLowerCase() !== cible) continue;
          produitsTemp.push({
            id: i,
            idRecolte: produit.idRecolte.toString(),
            nom: produit.nom,
            quantite: produit.quantite.toString(),
            prixUnit: produit.prixUnit.toString(),
            statut: Number(produit.statut),
            dateRecolte: produit.dateRecolte,
            certificatPhytosanitaire: produit.certificatPhytosanitaire,
            collecteur: produit.collecteur.toString()
          });
        }
        produitsTemp.reverse();
        setProduits(produitsTemp);
        console.log(produitsTemp)
      } catch (error) {
        console.error("Erreur lors du chargement des produits:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    chargerProduits();
  }, [address, _]);

  const handleModifierPrix = async (produitId) => {
    try {
      const contract = await getCollecteurExportateurContract();
      
      // Vérifier que le nouveau prix est valide
      const prix = Number(nouveauPrix);
      if (isNaN(prix) || prix <= 0) {
        setError("Veuillez entrer un prix valide");
        return;
      }
      
      // Modifier le prix
      const tx = await contract.setPriceProduit(
        produitId,
        prix
      );
      await tx.wait();
      
      // Mettre à jour l'état local
      const produitsTemp = [...produits];
      const index = produitsTemp.findIndex(p => p.id === produitId);
      if (index !== -1) {
        produitsTemp[index].prixUnit = prix.toString();
        setProduits(produitsTemp);
      }

      // Fermer le modal
      setShowModal(false);
      setProduitSelectionne(null);
      setNouveauPrix("");
    } catch (error) {
      console.error("Erreur lors de la modification du prix:", error);
      setError(error.message);
    }
  };

  const handleValiderProduit = async (produitId) => {
    try {
      const contract = await getCollecteurExportateurContract();
      
      // Valider le produit (true pour valider, false pour rejeter)
      const tx = await contract.validerProduit(produitId, true);
      await tx.wait();
      
      // Mettre à jour l'état local
      const produitsTemp = [...produits];
      const index = produitsTemp.findIndex(p => p.id === produitId);
      if (index !== -1) {
        produitsTemp[index].statut = 1; // 1 = Validé
        setProduits(produitsTemp);
      }
    } catch (error) {
      console.error("Erreur lors de la validation du produit:", error);
      setError(error.message);
    }
  };

  const getStatutProduit = (statut) => {
    switch(Number(statut)) {
      case 0: return "En attente";
      case 1: return "Validé";
      case 2: return "Rejeté";
      default: return "Inconnu";
    }
  };

  const getStatutProduitColor = (statut) => {
    switch(Number(statut)) {
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
        <h2 className="h5 mb-3">{address ? "Produits du collecteur" : "Liste des Produits"}</h2>
        
        {isLoading ? (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        ) : produits.length === 0 ? (
          <div className="text-center text-muted">
            Vous n'avez pas encore de produits.
          </div>
        ) : (
          <div className="row g-3">
            {produits.map((produit) => (
              <div key={produit.id} className="col-md-4">
                <div className="card border shadow-sm p-3">
                  <h5 className="card-title">{produit.nom}</h5>
                  <div className="card-text small">
                    <p><strong>ID Récolte:</strong> {produit.idRecolte}</p>
                    <p><strong>Quantité:</strong> {produit.quantite} kg</p>
                    <p><strong>Prix unitaire:</strong> {produit.prixUnit} Ar</p>
                    <p><strong>Date de récolte:</strong> {produit.dateRecolte}</p>
                    <p><strong>Certificat phytosanitaire:</strong> {produit.certificatPhytosanitaire}</p>
                    <p className={`fw-semibold ${getStatutProduitColor(produit.statut)}`}>
                      <strong>Statut:</strong> {getStatutProduit(produit.statut)}
                    </p>
                  </div>
                  <div className="mt-3">
                    {userRole === 3 && ( // Collecteur
                      <button
                        onClick={() => {
                          setProduitSelectionne(produit);
                          setNouveauPrix(produit.prixUnit);
                          setShowModal(true);
                        }}
                        className="btn btn-sm btn-primary"
                      >
                        Modifier le prix
                      </button>
                    )}
                    {userRole === 6 && produit.statut === 0 && ( // Exportateur et produit en attente
                      <button
                        onClick={() => handleValiderProduit(produit.id)}
                        className="btn btn-sm btn-success"
                      >
                        Valider le produit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de modification du prix */}
      {showModal && produitSelectionne && (
        <>
        <div className="modal-backdrop fade show"></div>

        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Modifier le prix de {produitSelectionne.nom}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Prix actuel: {produitSelectionne.prixUnit} Ar</label>
                  <input
                    type="number"
                    className="form-control"
                    value={nouveauPrix}
                    onChange={(e) => setNouveauPrix(e.target.value)}
                    placeholder="Nouveau prix"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleModifierPrix(produitSelectionne.id)}
                >
                  Confirmer la modification
                </button>
              </div>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
}

export default ListeProduits; 