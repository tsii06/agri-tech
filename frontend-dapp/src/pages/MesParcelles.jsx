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
      const compteurParcellesResult = await contract.compteurParcelles();
      const compteurParcelles = compteurParcellesResult.toNumber();
      console.log("Nombre de parcelles:", compteurParcelles);

      if (compteurParcelles === 0) {
        setParcelles([]);
        setLoading(false);
        return;
      }

      const parcellesPromises = [];
      // On commence à 1 car les IDs commencent à 1
      for (let i = 1; i <= compteurParcelles; i++) {
        parcellesPromises.push(contract.obtenirInformationsParcelle(i));
      }

      const parcellesData = await Promise.all(parcellesPromises);
      console.log("Données des parcelles:", parcellesData);

      const parcellesFormatees = parcellesData.map((parcelle, index) => ({
        id: index + 1,
        qualiteSemence: parcelle[0],
        methodeCulture: parcelle[1],
        latitude: parcelle[2],
        longitude: parcelle[3],
        produit: parcelle[4],
        dateRecolte: parcelle[5],
        certificatPhytosanitaire: parcelle[6]
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
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Mes Parcelles</h2>
        <div className="space-x-4">
          <button
            onClick={creerParcelleParDefaut}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Créer Parcelle Test
          </button>
          <Link
            to="/creer-parcelle"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Nouvelle Parcelle
          </Link>
        </div>
      </div>

      {parcelles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parcelles.map((parcelle) => (
            <div
              key={parcelle.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold mb-2">{parcelle.produit}</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Qualité des semences:</span>{" "}
                  {parcelle.qualiteSemence}
                </p>
                <p>
                  <span className="font-medium">Méthode de culture:</span>{" "}
                  {parcelle.methodeCulture}
                </p>
                <p>
                  <span className="font-medium">Localisation:</span>{" "}
                  {parcelle.latitude}, {parcelle.longitude}
                </p>
                <p>
                  <span className="font-medium">Date de récolte prévue:</span>{" "}
                  {parcelle.dateRecolte}
                </p>
              </div>
              <div className="mt-4 flex space-x-2">
                <Link
                  to={`/parcelle/${parcelle.id}/photos`}
                  className="text-indigo-600 hover:text-indigo-800 text-sm"
                >
                  Photos
                </Link>
                <Link
                  to={`/parcelle/${parcelle.id}/intrants`}
                  className="text-indigo-600 hover:text-indigo-800 text-sm"
                >
                  Intrants
                </Link>
                <Link
                  to={`/parcelle/${parcelle.id}/inspections`}
                  className="text-indigo-600 hover:text-indigo-800 text-sm"
                >
                  Inspections
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Aucune parcelle
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Commencez par créer votre première parcelle
          </p>
          <div className="mt-6">
            <Link
              to="/creer-parcelle"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <svg
                className="-ml-1 mr-2 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Créer une parcelle
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default MesParcelles; 