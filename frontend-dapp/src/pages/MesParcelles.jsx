import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getContract } from "../utils/contract";
import { ethers } from "ethers";

function MesParcelles() {
  const [parcelles, setParcelles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    chargerParcelles();
  }, []);

  const chargerParcelles = async () => {
    try {
      const contract = await getContract();
      
      // Récupérer le compteur de parcelles en utilisant la méthode appropriée
      const compteurParcelles = await contract.getCompteurParcelle();
      // const compteurParcelles = compteurParcellesResult.toNumber();
      console.log("Nombre de parcelles:", compteurParcelles);

      if (compteurParcelles === 0) {
        setParcelles([]);
        setLoading(false);
        return;
      }

      const parcelles = [];
      // On commence à 1 car les IDs commencent à 1
      for (let i = 1; i <= compteurParcelles; i++) {
        parcelles.push(await contract.getParcelle(i));
      }

      setParcelles(parcelles);
      setError(null);
    } catch (error) {
      console.error("Erreur détaillée:", error);
      setError("Impossible de charger les parcelles. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };



  const getEtapeLabel = (etape) => {
    const etapes = {
      0: "Semis",
      1: "Croissance",
      2: "Récolte"
    };
    return etapes[etape] || "Inconnue";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erreur</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={chargerParcelles}
                className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {error && (
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <svg className="bi flex-shrink-0 me-2" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 16A8 8 0 108 0a8 8 0 000 16zm0-14.5A6.5 6.5 0 111.5 8 6.508 6.508 0 018 1.5zM6.354 4.646a.5.5 0 00-.708.708L7.293 8l-1.647 1.646a.5.5 0 00.708.708L8 8.707l1.646 1.647a.5.5 0 00.708-.708L8.707 8l1.647-1.646a.5.5 0 00-.708-.708L8 7.293 6.354 4.646z"/>
          </svg>
          <div>
            {error}
            <button onClick={chargerParcelles} className="btn btn-link text-danger">Réessayer</button>
          </div>
        </div>
      )}
      
      <div className="d-flex justify-content-between mb-3">
        <h2 className="h4">Mes Parcelles</h2>
        <div>

          <Link to="/creer-parcelle" className="btn btn-primary">Nouvelle Parcelle</Link>
        </div>
      </div>

      {parcelles.length > 0 ? (
        <div className="row g-3">
          {parcelles.map((parcelle) => (
            <div key={parcelle.id} className="col-md-4">
              <div className="card shadow-sm p-3">
                <h5 className="card-title">{parcelle.produit}</h5>
                <div className="card-text">
                  <p><strong>Qualité des semences:</strong> {parcelle.qualiteSemence}</p>
                  <p><strong>Méthode de culture:</strong> {parcelle.methodeCulture}</p>
                  <p><strong>Localisation:</strong> {parcelle.latitude}, {parcelle.longitude}</p>
                  <p><strong>Date de récolte prévue:</strong> {parcelle.dateRecolte}</p>
                </div>
                <div className="d-flex justify-content-between mt-2">
                  <Link to={`/parcelle/${parcelle.id}/photos`} className="btn btn-link">Photos(producteur)</Link>
                  <Link to={`/parcelle/${parcelle.id}/intrants`} className="btn btn-link">Intrants(fournisseur)</Link>
                  <Link to={`/parcelle/${parcelle.id}/inspections`} className="btn btn-link">Inspections(certificateur)</Link>
                  <Link to={`/parcelle/${parcelle.id}/faire-recolte`} className="btn btn-link">Recolter(producteur)</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5">
          <p className="text-muted">Aucune parcelle enregistrée.</p>
          <Link to="/creer-parcelle" className="btn btn-primary">Créer une parcelle</Link>
        </div>
      )}
    </div>
  );
}

export default MesParcelles; 