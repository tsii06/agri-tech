import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import { getContract, getCollecteurProducteurContract } from "../../utils/contract";
import { getRoleName } from "../../components/Layout/Header";

function ListeRecoltes() {
  const [recoltes, setRecoltes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acteur, setActeur] = useState({});
  const [_, setState] = useState({});

  useEffect(() => {
    const chargerRecoltes = async () => {
      try {
        const contract = await getCollecteurProducteurContract();
        const provider = contract.runner.provider;
        const signer = await provider.getSigner();
        const account = await signer.getAddress();

        console.log("Adresse connectée:", account);

        const contractProducteur = await getContract();

        // Récupérer l'acteur
        const _acteur = await contractProducteur.getActeur(account);

        // Obtenir le nombre total de récoltes
        const compteurRecoltes = await contract.getCompteurRecoltes();
        console.log("Nombre total de récoltes:", compteurRecoltes.toString());
        
        // Charger toutes les récoltes
        const recoltesTemp = [];
        for (let i = 1; i <= compteurRecoltes; i++) {
          const recolte = await contract.getRecolte(i);
          
          // // Si l'utilisateur est un producteur, on ne montre que ses récoltes
          // if (getRoleName(_acteur.role) === "PRODUCEUR") {
          //   const producteurAddress = recolte.producteur.toString();
          //   if (producteurAddress.toLowerCase() !== account.toLowerCase()) {
          //     continue;
          //   }
          // }

          recoltesTemp.push({
            id: i,
            idParcelle: recolte.idParcelle.toString(),
            quantite: recolte.quantite.toString(),
            prix: recolte.prixUnit,
            dateRecolte: recolte.dateRecolte,
            nomProduit: recolte.nomProduit,
            certifie: recolte.certifie,
            producteur: recolte.producteur.toString()
          });
        }
        
        console.log("Récoltes trouvées:", recoltesTemp);
        setActeur(_acteur);
        // Inverser le tri des récoltes pour que les plus récentes soient en premier
        recoltesTemp.reverse();
        setRecoltes(recoltesTemp);
      } catch (error) {
        console.error("Erreur lors du chargement des récoltes:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    chargerRecoltes();
  }, [_]);

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
            {getRoleName(acteur.role) === "PRODUCTEUR" ? "Mes Récoltes" : "Liste des Récoltes"}
          </h2>
          {getRoleName(acteur.role) === "PRODUCTEUR" && (
            <Link to="/fairerecolte" className="btn btn-primary">
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
            {getRoleName(acteur.role) === "PRODUCTEUR" 
              ? "Vous n'avez pas encore de récoltes enregistrées."
              : "Aucune récolte n'est enregistrée pour le moment."}
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
                    <p><strong>Prix:</strong> {recolte.prix} MADATX</p>
                    <p><strong>Date de récolte:</strong> {recolte.dateRecolte}</p>
                    <p className={`fw-semibold ${getStatutCertificationColor(recolte.certifie)}`}>
                      <strong>Statut:</strong> {getStatutCertification(recolte.certifie)}
                    </p>
                  </div>
                  {getRoleName(acteur.role) === "CERTIFICATEUR" && !recolte.certifie && (
                    <div className="mt-3">
                      <Link
                        to={`/certifier-recolte/${recolte.id}`}
                        className="btn btn-sm btn-primary"
                      >
                        Certifier
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

export default ListeRecoltes; 