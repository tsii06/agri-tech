import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ethers } from "ethers";
import {  getCollecteurProducteurContract, getRoleOfAddress } from "../../utils/contract";
import { useUserContext } from '../../context/useContextt';

function ListeRecoltes() {
  const { address } = useParams();
  const navigate = useNavigate();
  const [recoltes, setRecoltes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [acteur, setActeur] = useState({});
  const [_, setState] = useState({});
  const [quantiteCommande, setQuantiteCommande] = useState("");
  const [recolteSelectionnee, setRecolteSelectionnee] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const { role, account, verifeActeur } = useUserContext();

  const chargerRecoltes = async () => {
    try {
      const contract = await getCollecteurProducteurContract();
      let role = userRole;
      let cible = address ? address.toLowerCase() : (account ? account.toLowerCase() : null);
      if (!role && !address && account) {
        role = await getRoleOfAddress(account);
        setUserRole(role);
      }
      // Obtenir le nombre total de récoltes
      const compteurRecoltes = await contract.compteurRecoltes();
      const recoltesTemp = [];
      for (let i = 1; i <= compteurRecoltes; i++) {
        const recolte = await contract.getRecolte(i);
        if (cible && recolte.producteur.toLowerCase() !== cible) continue;
        recoltesTemp.push(recolte);
      }
      recoltesTemp.reverse();
      setRecoltes(recoltesTemp);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!address && !account) return;
    chargerRecoltes();
  }, [address, account]);

  const handleCertifier = async (recolteId) => {
    try {
      const contract = await getCollecteurProducteurContract();
      const certificat = "Certificat de qualité"; // À remplacer par le vrai certificat
      const tx = await contract.certifieRecolte(recolteId, certificat);
      await tx.wait();
      
      chargerRecoltes();

    } catch (error) {
      console.error("Erreur lors de la certification:", error);
      setError(error.message);
    }
  };

  const handleCommander = async (recolteId) => {
    try {
      const contract = await getCollecteurProducteurContract();
      const recolte = recoltes.find(r => r.id === recolteId);
      
      // Vérifier que la quantité est valide
      const quantite = Number(quantiteCommande);
      if (isNaN(quantite) || quantite <= 0) {
        setError("Veuillez entrer une quantité valide");
        return;
      }
      
      if (quantite > Number(recolte.quantite)) {
        setError("La quantité demandée est supérieure à la quantité disponible");
        return;
      }
      
      // Passer la commande
      const tx = await contract.passerCommandeVersProducteur(
        recolteId,
        quantite
      );
      await tx.wait();
      
      // Rediriger vers la page des commandes
      navigate('/liste-collecteur-commande');
    } catch (error) {
      console.error("Erreur lors de la commande:", error);
      setError(error.message);
    }
  };

  const getStatutCertification = (certifie) => {
    return certifie ? "Certifié" : "Non certifié";
  };

  const getStatutCertificationColor = (certifie) => {
    return certifie ? "text-success" : "text-warning";
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center text-red-600">
            Erreur lors du chargement des récoltes: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="card p-4 shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="h5 mb-0">
            {address ? "Récoltes du producteur" : userRole === 0 ? "Mes Récoltes" : "Liste des Récoltes"}
          </h2>
          {!address && userRole === 0 && (
            <Link to="/mes-parcelles" className="btn btn-primary">
              Ajouter une récolte
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        ) : recoltes.length === 0 ? (
          <div className="text-center text-muted">
            {userRole === 0 ? "Vous n'avez pas encore de récoltes enregistrées." : "Aucune récolte n'est enregistrée pour le moment."}
          </div>
        ) : (
          <div className="row g-3">
            {recoltes.map((recolte) => (
              <div key={recolte.id} className="col-md-4">
                <div className="card border shadow-sm p-3">
                  <h5 className="card-title">{recolte.nomProduit}</h5>
                  <div className="card-text small">
                    <p><strong>ID Parcelle:</strong> {recolte.idParcelle}</p>
                    <p><strong>Quantité:</strong> {recolte.quantite} kg</p>
                    <p><strong>Prix:</strong> {recolte.prixUnit} Ar</p>
                    <p><strong>Date de récolte:</strong> {recolte.dateRecolte}</p>
                    <p className={`fw-semibold ${getStatutCertificationColor(recolte.certifie)}`}>
                      <strong>Statut:</strong> {getStatutCertification(recolte.certifie)}
                    </p>
                  </div>
                  <div className="mt-3">
                    {userRole === 2 && !recolte.certifie && (
                      <button
                        onClick={() => handleCertifier(recolte.id)}
                        className="btn btn-sm btn-primary me-2"
                      >
                        Certifier
                      </button>
                    )}
                    {userRole === 3 && recolte.certifie && (
                      <button
                        onClick={() => {
                          setRecolteSelectionnee(recolte);
                          setShowModal(true);
                        }}
                        className="btn btn-sm btn-success"
                      >
                        Commander
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de commande */}
      {showModal && recolteSelectionnee && (
        <>
        <div className="modal-backdrop fade show"></div>

          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Commander {recolteSelectionnee.nomProduit}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Quantité disponible: {recolteSelectionnee.quantite} kg</label>
                    <input
                      type="number"
                      className="form-control"
                      value={quantiteCommande}
                      onChange={(e) => setQuantiteCommande(e.target.value)}
                      placeholder="Quantité à commander"
                    />
                  </div>
                  <div className="mb-3">
                    <p>Prix unitaire: {recolteSelectionnee.prixUnit} Ar</p>
                    <p>Total: {Number(quantiteCommande) * Number(recolteSelectionnee.prixUnit)} Ar</p>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleCommander(recolteSelectionnee.id)}
                  >
                    Confirmer la commande
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

export default ListeRecoltes; 