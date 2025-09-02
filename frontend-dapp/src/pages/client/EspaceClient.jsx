import { Sprout } from "lucide-react";
import React, { useState } from "react";

const EspaceClient = () => {
  const [reference, setReference] = useState("");
  const [traceabilityData, setTraceabilityData] = useState(null);

  const handleSearch = async () => {
    if (!reference) {
      alert("Veuillez entrer une référence produit.");
      return;
    }

    try {
      // Simuler une requête pour récupérer les données de traçabilité
      const data = await fetch(`/api/traceability?reference=${reference}`);
      if (!data.ok) {
        throw new Error("Référence invalide ou données introuvables.");
      }
      const result = await data.json();
      setTraceabilityData(result);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="text-center mb-4">Découvrez l'origine de vos produits</h2>
      <p className="text-center mb-4 text-muted">
        Suivez le parcours complet de vos produits agricoles, de la parcelle à
        l'exportation, grâce à notre système de traçabilité transparent.
      </p>
      {/* Encapsulation de la barre de recherche et du bouton dans une carte */}
      <div
        className="card shadow-sm p-4 mb-4"
        style={{ maxWidth: "75%", margin: "0 auto" }}
      >
        <div className="d-flex justify-content-around">
          <div className="input-group" style={{ maxWidth: "75%" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Entrez une référence produit (ex: REF-12345)"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          <button className="btn btn-success" onClick={handleSearch}>
            Afficher traçabilité
          </button>
        </div>
        <p className="text-center text-muted mt-3">
          Références de test disponibles : REF-12345, REF-67890
        </p>
      </div>

      {/* Ajout des trois cartes sous la barre de recherche */}
      <div className="row mt-4">
        <div className="col-md-4">
          <div className="card shadow-sm p-4 text-center">
            <div className="mb-3">
              <Sprout className="text-success bg-success bg-opacity-25 rounded-circle p-2" size={48} />
            </div>
            <h5>Origine certifiée</h5>
            <p className="text-muted">
              Vérifiez l'authenticité et la qualité de vos produits agricoles
            </p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm p-4 text-center">
            <div className="mb-3">
              <Sprout className="text-info bg-info bg-opacity-25 rounded-circle p-2" size={48} />
            </div>
            <h5>Traçabilité complète</h5>
            <p className="text-muted">
              Suivez chaque étape, du producteur au consommateur
            </p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm p-4 text-center">
            <div className="mb-3">
              <Sprout className="text-warning bg-warning bg-opacity-25 rounded-circle p-2" size={48} />
            </div>
            <h5>Transparence totale</h5>
            <p className="text-muted">
              Accédez à tous les documents et certifications
            </p>
          </div>
        </div>
      </div>

      {traceabilityData && (
        <div className="mt-4">
          <h4 className="text-center">Détails de la traçabilité</h4>
          <pre className="bg-light p-3" style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(traceabilityData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default EspaceClient;
