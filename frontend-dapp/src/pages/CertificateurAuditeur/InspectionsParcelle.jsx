import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getProducteurContract } from "../../utils/contract";
import { getIPFSURL } from "../../utils/ipfsUtils";

function InspectionsParcelle() {
  const { id } = useParams();
  const [parcelle, setParcelle] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ajoutEnCours, setAjoutEnCours] = useState(false);
  const [rapport, setRapport] = useState("");

  useEffect(() => {
    chargerParcelleEtInspections();
  }, [id]);

  const chargerParcelleEtInspections = async () => {
    try {
      const contract = await getProducteurContract();
      
      // Charger la parcelle
      const parcelleRaw = await contract.getParcelle(id);
      const parcelleEnrichie = {
        id: Number(parcelleRaw.id),
        producteur: parcelleRaw.producteur?.toString?.() || "",
        cid: parcelleRaw.cid || "",
        hashMerkle: parcelleRaw.hashMerkle || ""
      };

      // Charger les données IPFS de la parcelle
      if (parcelleEnrichie.cid) {
        try {
          const response = await fetch(getIPFSURL(parcelleEnrichie.cid));
          if (response.ok) {
            const ipfsData = await response.json();
            const root = ipfsData && ipfsData.items ? ipfsData.items : ipfsData;
            parcelleEnrichie.nom = root.nom || "";
            parcelleEnrichie.superficie = root.superficie || 0;
            parcelleEnrichie.photos = root.photos || [];
            parcelleEnrichie.intrants = root.intrants || [];
            parcelleEnrichie.inspections = root.inspections || [];
            parcelleEnrichie.ipfsRoot = root;
            parcelleEnrichie.ipfsTimestamp = ipfsData.timestamp;
          }
        } catch (ipfsError) {
          console.log("Erreur lors du chargement IPFS de la parcelle:", ipfsError);
        }
      }

      setParcelle(parcelleEnrichie);
      setInspections(parcelleEnrichie.inspections || []);
    } catch (error) {
      console.error("Erreur lors du chargement de la parcelle:", error);
      alert("Erreur lors du chargement de la parcelle");
    } finally {
      setLoading(false);
    }
  };

  const ajouterInspection = async (e) => {
    e.preventDefault();
    setAjoutEnCours(true);

    try {
      const contract = await getProducteurContract();
      
      // Créer la nouvelle inspection
      const nouvelleInspection = {
        rapport: rapport,
        auditeur: await contract.signer.getAddress(),
        timestamp: Math.floor(Date.now() / 1000)
      };

      // Ajouter l'inspection à la liste existante
      const inspectionsMisesAJour = [...inspections, nouvelleInspection];

      // Mettre à jour les données IPFS de la parcelle
      const donneesMisesAJour = {
        ...parcelle.ipfsRoot,
        inspections: inspectionsMisesAJour
      };

      // Ici, vous devriez uploader les nouvelles données vers IPFS
      // et mettre à jour le CID de la parcelle
      // Pour l'instant, on simule la mise à jour
      
      alert("Inspection ajoutée avec succès !");
      setRapport("");
      await chargerParcelleEtInspections();
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
      
      {parcelle && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Informations de la parcelle</h5>
            <p><strong>Nom:</strong> {parcelle.nom || "N/A"}</p>
            <p><strong>Superficie:</strong> {parcelle.superficie} ha</p>
            <p><strong>Producteur:</strong> {parcelle.producteur ? `${parcelle.producteur.slice(0, 6)}...${parcelle.producteur.slice(-4)}` : "N/A"}</p>
            {parcelle.cid && (
              <p><strong>CID IPFS:</strong> 
                <a href={getIPFSURL(parcelle.cid)} target="_blank" rel="noopener noreferrer" className="ms-2 text-decoration-none">
                  {parcelle.cid.substring(0, 10)}...
                </a>
              </p>
            )}
          </div>
        </div>
      )}

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
                      Par: {inspection.auditeur ? `${inspection.auditeur.substring(0, 6)}...${inspection.auditeur.substring(inspection.auditeur.length - 4)}` : "N/A"}
                    </p>
                  </div>
                  <span className="text-muted small">
                    {inspection.timestamp ? new Date(parseInt(inspection.timestamp) * 1000).toLocaleString() : "N/A"}
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