import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import { getContract } from "../utils/contract";
import { getRoleName } from "../components/Layout/Header";

function RecoltesProducteur() {
  const { address } = useParams();
  const [recoltes, setRecoltes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acteur, setActeur] = useState({});

  useEffect(() => {
    const chargerRecoltes = async () => {
      try {
        const contract = await getContract();
        const provider = contract.runner.provider;
        const signer = await provider.getSigner();
        const account = await signer.getAddress();

        // Récupérer l'acteur connecté
        const _acteur = await contract.acteurs(account);
        setActeur(_acteur);

        // Obtenir l'adresse du contrat de récolte
        const recolteAddress = await contract.recolte();
        
        // Créer une instance du contrat de récolte
        const recolteContract = new ethers.Contract(
          recolteAddress,
          contract.interface,
          signer
        );

        // Obtenir le nombre total de récoltes
        const compteurRecoltes = await recolteContract.getCompteurRecolte();
        
        // Charger les récoltes du producteur
        const recoltesTemp = [];
        for (let i = 1; i <= compteurRecoltes; i++) {
          const recolte = await recolteContract.getRecolte(i);
          if (recolte.producteur.toString().toLowerCase() === address.toLowerCase()) {
            recoltesTemp.push({
              id: i,
              idParcelle: recolte.idParcelle.toString(),
              quantite: recolte.quantite.toString(),
              prix: recolte.prix.toString(),
              dateRecolte: recolte.dateRecolte,
              nomProduit: recolte.nomProduit,
              certifie: recolte.certifie
            });
          }
        }
        
        setRecoltes(recoltesTemp);
      } catch (error) {
        console.error("Erreur lors du chargement des récoltes:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    chargerRecoltes();
  }, [address]);

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
          <h2 className="h5 mb-0">Récoltes du Producteur</h2>
          <div className="text-muted small">
            Adresse: {address.substring(0, 6)}...{address.substring(address.length - 4)}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        ) : recoltes.length === 0 ? (
          <div className="text-center text-muted">
            Ce producteur n'a pas encore de récoltes enregistrées.
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
                    <p><strong>Prix:</strong> {recolte.prix} FCFA</p>
                    <p><strong>Date de récolte:</strong> {recolte.dateRecolte}</p>
                    <p className={`fw-semibold ${getStatutCertificationColor(recolte.certifie)}`}>
                      <strong>Statut:</strong> {getStatutCertification(recolte.certifie)}
                    </p>
                  </div>
                  {getRoleName(acteur.role) === "COLLECTEUR" && !recolte.certifie && (
                    <div className="mt-3">
                      <Link
                        to={`/producteur/${address}/recoltes/acheter?recolteId=${recolte.id}`}
                        className="btn btn-sm btn-success"
                      >
                        Acheter cette récolte
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RecoltesProducteur; 