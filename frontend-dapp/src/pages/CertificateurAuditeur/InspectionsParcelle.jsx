import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getContract } from "../../utils/contract";


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
    <div className="container py-4">
      <h2 className="h4 mb-4">Inspections de la parcelle #{id}</h2>

      <form onSubmit={ajouterInspection} className="mb-4">
        <div className="mb-3">
          <label className="form-label">Rapport d&apos;inspection</label>
          <textarea
            value={rapport}
            onChange={(e) => setRapport(e.target.value)}
            required
            rows={4}
            className="form-control"
            placeholder="Détaillez votre inspection ici..."
          />
        </div>
        <button
          type="submit"
          disabled={ajoutEnCours}
          className={`btn ${ajoutEnCours ? "btn-secondary disabled" : "btn-primary"}`}
        >
          {ajoutEnCours ? "Ajout en cours..." : "Ajouter l'inspection"}
        </button>
      </form>

      {inspections.length > 0 ? (
        <div className="row g-3">
          {inspections.map((inspection, index) => (
            <div key={index} className="col-md-6">
              <div className="card shadow-sm p-3">
                <div className="d-flex justify-content-between mb-2">
                  <div>
                    <h5 className="card-title">Inspection #{index + 1}</h5>
                    <p className="text-muted small">
                      Par: {inspection.auditeur.substring(0, 6)}...
                      {inspection.auditeur.substring(inspection.auditeur.length - 4)}
                    </p>
                  </div>
                  <span className="text-muted small">
                    {new Date(parseInt(inspection.timestamp) * 1000).toLocaleString()}
                  </span>
                </div>
                <p className="card-text text-muted">{inspection.rapport}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted">Aucune inspection n&apos;a encore été effectuée pour cette parcelle.</div>
      )}
    </div>
  );
}

export default InspectionsParcelle; 