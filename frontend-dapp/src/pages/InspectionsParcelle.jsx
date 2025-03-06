import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getContract } from "../utils/contract";

function InspectionsParcelle() {
  const { id } = useParams();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ajoutEnCours, setAjoutEnCours] = useState(false);
  const [rapport, setRapport] = useState("");

  useEffect(() => {
    chargerInspections();
  }, [id]);

  const chargerInspections = async () => {
    try {
      const contract = await getContract();
      const inspectionsData = await contract.getInspections(id);
      // inspectionsData est un objet, il faut la convertir
      setInspections(Object.values(inspectionsData));
    } catch (error) {
      console.error("Erreur lors du chargement des inspections:", error);
      alert("Erreur lors du chargement des inspections");
    } finally {
      setLoading(false);
    }
  };

  const ajouterInspection = async (e) => {
    e.preventDefault();
    setAjoutEnCours(true);

    try {
      const contract = await getContract();
      const tx = await contract.ajouterInspection(id, rapport);
      await tx.wait();
      
      alert("Inspection ajoutée avec succès !");
      setRapport("");
      await chargerInspections();
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'inspection:", error);
      alert("Erreur lors de l'ajout de l'inspection");
    } finally {
      setAjoutEnCours(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Inspections de la parcelle #{id}</h2>

      <form onSubmit={ajouterInspection} className="mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rapport d'inspection
          </label>
          <textarea
            value={rapport}
            onChange={(e) => setRapport(e.target.value)}
            required
            rows={4}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Détaillez votre inspection ici..."
          />
        </div>
        <button
          type="submit"
          disabled={ajoutEnCours}
          className={`mt-4 px-4 py-2 rounded-md text-white ${
            ajoutEnCours
              ? "bg-indigo-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {ajoutEnCours ? "Ajout en cours..." : "Ajouter l'inspection"}
        </button>
      </form>

      {inspections.length > 0 ? (
        <div className="space-y-6">
          {inspections.map((inspection, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    Inspection #{index + 1}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Par: {inspection.auditeur.substring(0, 6)}...
                    {inspection.auditeur.substring(inspection.auditeur.length - 4)}
                  </p>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(parseInt(inspection.timestamp) * 1000).toLocaleString()}
                </span>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {inspection.rapport}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500">
          Aucune inspection n'a encore été effectuée pour cette parcelle.
        </div>
      )}
    </div>
  );
}

export default InspectionsParcelle; 