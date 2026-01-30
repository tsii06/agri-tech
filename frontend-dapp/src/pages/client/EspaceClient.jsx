import { Sprout } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const EspaceClient = () => {
  const [reference, setReference] = useState("");
  const nav = useNavigate();

  const handleSearch = async () => {
    if (!reference) {
      alert("Veuillez entrer une référence produit.");
      return;
    }
    nav(`/passe-port-numerique-client/${reference}`);
  };

  return (
    <div className="container py-4">
      <h2 className="text-center mb-4">Découvrez l&apos;origine de vos produits</h2>
      <p className="text-center mb-4 text-muted">
        Suivez le parcours complet de vos produits agricoles, de la parcelle à
        l&apos;exportation, grâce à notre système de traçabilité transparent.
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
              Vérifiez l&apos;authenticité et la qualité de vos produits agricoles
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
    </div>
  );
};

export default EspaceClient;
