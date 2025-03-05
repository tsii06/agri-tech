import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getContract } from "../utils/contract";

function CreerParcelle() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const contract = await getContract();
      
      // Valeurs par défaut
      const qualiteSemence = "Bonne";
      const methodeCulture = "Traditionnelle";
      const latitude = "-18.8792";
      const longitude = "47.5079";
      const nomProduit = "Riz";
      const dateRecolte = "2024-12-31";
      const certificatPhytosanitaire = "CERT-2024-001";

      // Créer la parcelle
      const tx = await contract.creerParcelle(
        qualiteSemence,
        methodeCulture,
        latitude,
        longitude,
        nomProduit,
        dateRecolte,
        certificatPhytosanitaire
      );

      await tx.wait();
      
      // Rediriger vers la liste des parcelles
      navigate("/mes-parcelles");
      
    } catch (error) {
      console.error("Erreur lors de la création de la parcelle:", error);
      setError("Impossible de créer la parcelle. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Créer une nouvelle parcelle</h2>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Valeurs par défaut qui seront utilisées :</h3>
            <dl className="mt-4 space-y-2">
              <div className="grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">Qualité des semences</dt>
                <dd className="text-sm text-gray-900 col-span-2">Bonne</dd>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">Méthode de culture</dt>
                <dd className="text-sm text-gray-900 col-span-2">Traditionnelle</dd>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">Localisation</dt>
                <dd className="text-sm text-gray-900 col-span-2">-18.8792, 47.5079 (Antananarivo)</dd>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">Produit</dt>
                <dd className="text-sm text-gray-900 col-span-2">Riz</dd>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">Date de récolte</dt>
                <dd className="text-sm text-gray-900 col-span-2">31/12/2024</dd>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">Certificat phytosanitaire</dt>
                <dd className="text-sm text-gray-900 col-span-2">CERT-2024-001</dd>
              </div>
            </dl>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              loading
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? "Création en cours..." : "Créer la parcelle avec ces valeurs"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreerParcelle; 