import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getContract } from "../../utils/contract";
import { useUserContext } from "../../context/useContextt";
import { hasRole } from "../../utils/roles";
import {
  uploadInspection,
  getIPFSURL,
  updateCidParcelle,
} from "../../utils/ipfsUtils";

function InspectionsParcelle() {
  const { id } = useParams(); // id de la parcelle
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [parcelle, setParcelle] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [formData, setFormData] = useState({
    rapport: "",
    observations: "",
    recommandations: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const { account, roles } = useUserContext();

  useEffect(() => {
    chargerParcelle();
  }, [id]);

  const chargerParcelle = async () => {
    try {
      const contract = await getContract();
      const parcelleData = await contract.getParcelle(id);
      setParcelle(parcelleData);

      // Si la parcelle a un CID, essayer de récupérer les inspections
      if (parcelleData.cid) {
        try {
          const response = await fetch(getIPFSURL(parcelleData.cid));
          if (response.ok) {
            const data = await response.json();
            const root = data && data.items ? data.items : data;

            // recuperer tous les data necessaire a un intrant
            if (root && root.inspections && Array.isArray(root.inspections)) {
              setInspections(root.inspections);
            }
          }
        } catch (error) {
          console.log(
            "Pas d'inspections existantes ou erreur de récupération IPFS"
          );
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la parcelle:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // 1. Créer l'objet inspection
      const inspectionData = {
        parcelleId: id,
        auditeur: account,
        rapport: formData.rapport,
        observations: formData.observations,
        recommandations: formData.recommandations,
        timestamp: Date.now(),
      };

      // 2. Upload de l'inspection sur IPFS
      const inspectionUpload = await uploadInspection(
        selectedFile,
        inspectionData
      );

      if (!inspectionUpload.success) {
        throw new Error("Erreur lors de l'upload de l'inspection sur IPFS");
      }

      // 3. Créer l'objet inspection complet
      const nouvelleInspection = {
        ...inspectionData,
        cid: inspectionUpload.cid,
        id: inspections.length + 1,
      };

      // 4. Ajouter la nouvelle inspection à la liste
      const nouvellesInspections = [...inspections, nouvelleInspection];

      // mettre a jour la nouvelle cid relier au parcelle
      const masterUpload = await updateCidParcelle(
        parcelle,
        nouvellesInspections,
        "inspections"
      );

      // 9. Mettre à jour l'état local
      setInspections(nouvellesInspections);
      setParcelle({
        id: parcelle.id,
        producteur: parcelle.producteur,
        cid: masterUpload.cid,
        hashMerkle: parcelle.hashMerkle,
      });

      setFormData({ rapport: "", observations: "", recommandations: "" });
      setSelectedFile(null);
      setMessage(
        "Inspection ajoutée et enregistrée sur la blockchain avec succès !"
      );
    } catch (e) {
      setMessage(
        "Erreur lors de l'ajout de l'inspection : " + (e?.message || e)
      );
    } finally {
      setLoading(false);
    }
  };

  const afficherInspection = (inspection) => {
    return (
      <div key={inspection.id} className="col-md-6 mb-3">
        <div className="card">
          <div className="card-header">
            <h6 className="mb-0">Inspection #{inspection.id}</h6>
          </div>
          <div className="card-body">
            <p>
              <strong>Auditeur:</strong> {inspection.auditeur}
            </p>
            <p>
              <strong>Rapport:</strong> {inspection.rapport}
            </p>
            {inspection.observations && (
              <p>
                <strong>Observations:</strong> {inspection.observations}
              </p>
            )}
            {inspection.recommandations && (
              <p>
                <strong>Recommandations:</strong> {inspection.recommandations}
              </p>
            )}
            <p>
              <strong>Date:</strong>{" "}
              {new Date(inspection.timestamp).toLocaleDateString()}
            </p>
            <p>
              <strong>CID IPFS:</strong> {inspection.cid || "Non disponible"}
            </p>

            {inspection.cid && (
              <a
                href={getIPFSURL(inspection.cid)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline-secondary"
              >
                Voir sur IPFS
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mt-4">
      <h2>Gestion des inspections de la parcelle #{id}</h2>

      {/* Informations de la parcelle */}
      {parcelle && (
        <div className="card mb-4">
          <div className="card-header">
            <h5>Informations de la parcelle</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <p>
                  <strong>ID:</strong> {parcelle.id}
                </p>
                <p>
                  <strong>Producteur:</strong> {parcelle.producteur}
                </p>
                <p>
                  <strong>CID IPFS:</strong> {parcelle.cid || "Aucun"}
                </p>
              </div>
              <div className="col-md-6">
                <p>
                  <strong>Hash Merkle:</strong>{" "}
                  {parcelle.hashMerkle || "Non calculé"}
                </p>
                <p>
                  <strong>Nombre d'inspections:</strong> {inspections.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire d'ajout d'inspection */}
      {hasRole(roles, 4) && (
        <div className="card mb-4">
          <div className="card-header">
            <h5>Ajouter une nouvelle inspection</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="rapport" className="form-label">
                      Rapport d'inspection *
                    </label>
                    <textarea
                      className="form-control"
                      id="rapport"
                      name="rapport"
                      value={formData.rapport}
                      onChange={handleInputChange}
                      required
                      rows="3"
                      placeholder="Décrivez le rapport d'inspection..."
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="observations" className="form-label">
                      Observations
                    </label>
                    <textarea
                      className="form-control"
                      id="observations"
                      name="observations"
                      value={formData.observations}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Observations détaillées..."
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="recommandations" className="form-label">
                  Recommandations
                </label>
                <textarea
                  className="form-control"
                  id="recommandations"
                  name="recommandations"
                  value={formData.recommandations}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Recommandations pour améliorer..."
                />
              </div>

              <div className="mb-3">
                <label htmlFor="file" className="form-label">
                  Fichier d'inspection (optionnel)
                </label>
                <input
                  type="file"
                  className="form-control"
                  id="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <small className="form-text text-muted">
                  Vous pouvez joindre un fichier PDF, document ou image pour
                  compléter l'inspection.
                </small>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Ajout en cours..." : "Ajouter l'inspection"}
              </button>
            </form>

            {message && (
              <div
                className={`alert mt-3 ${
                  message.includes("succès") ? "alert-success" : "alert-info"
                }`}
              >
                {message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Liste des inspections */}
      <div className="card">
        <div className="card-header">
          <h5>Inspections de la parcelle ({inspections.length})</h5>
        </div>
        <div className="card-body">
          {inspections.length > 0 ? (
            <div className="row">{inspections.map(afficherInspection)}</div>
          ) : (
            <p className="text-muted">
              Aucune inspection effectuée pour cette parcelle.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default InspectionsParcelle;
