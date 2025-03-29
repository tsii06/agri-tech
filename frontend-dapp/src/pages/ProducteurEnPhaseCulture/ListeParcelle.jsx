import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getContract } from "../../utils/contract";
import ParcelleCard from "../../components/Tools/ParcelleCard";
import { useUserContext } from '../../context/useContextt';


function MesParcelles() {
  const [parcelles, setParcelles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const { role, account, verifeActeur } = useUserContext();


  useEffect(() => {
    chargerParcelles();
  }, []);


  const chargerParcelles = async () => {
    try {
      const contract = await getContract();
      const compteurParcelles = await contract.getCompteurParcelle();

      if (compteurParcelles === 0) {
        setParcelles([]);
        setLoading(false);
        return;
      }

      const parcellesPromises = [];
      for (let i = 1; i <= compteurParcelles; i++) {
        parcellesPromises.push(contract.obtenirInformationsParcelle(i));
      }

      const parcellesData = await Promise.all(parcellesPromises);
      // console.log("Données des parcelles:", parcellesData);

      const parcellesFormatees = parcellesData.map((parcelle, index) => ({
        id: index + 1,
        qualiteSemence: parcelle[0],
        methodeCulture: parcelle[1],
        latitude: parcelle[2],
        longitude: parcelle[3],
        dateRecolte: parcelle[4],
        certificatPhytosanitaire: parcelle[5]
      }));

      setParcelles(parcellesFormatees);
      setError(null);
    } catch (error) {
      console.error("Erreur détaillée:", error);
      setError("Impossible de charger les parcelles. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
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
      <div className="d-flex justify-content-between mb-3">
        <h2 className="h4">Parcelles</h2>
        {userRole === 'producteur' && (
          <Link to="/creer-parcelle" className="btn btn-primary">
            Nouvelle Parcelle
          </Link>
        )}
      </div>

      {parcelles.length > 0 ? (
        <div className="row g-3">
          {parcelles.map((parcelle) => (
            <div key={parcelle.id} className="col-md-4">
              <ParcelleCard 
                parcelle={parcelle}
                userRole={role}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5">
          <p className="text-muted">Aucune parcelle enregistrée.</p>
          {userRole === 'producteur' && (
            <Link to="/creer-parcelle" className="btn btn-primary">
              Créer une parcelle
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default MesParcelles; 