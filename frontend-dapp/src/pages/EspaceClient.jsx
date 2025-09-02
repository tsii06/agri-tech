import { useNavigate } from "react-router-dom";
import { useState } from "react";

function EspaceClient() {
  const navigate = useNavigate();
  const [idRecherche, setIdRecherche] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!idRecherche.trim()) return;
    navigate(`/espace-client/produit/${encodeURIComponent(idRecherche.trim())}`);
  };

  return (
    <div
      className="d-flex align-items-center"
      style={{ minHeight: "calc(100vh - 120px)", background: "linear-gradient(135deg, #f0f9f4 0%, #e8f5e9 100%)" }}
    >
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow-sm border-0" style={{ borderRadius: 16 }}>
              <div className="card-body p-4 p-md-5">
                <h2 className="h4 text-center mb-3" style={{ color: "#2e7d32" }}>
                  Espace Client
                </h2>
                <p className="text-center text-muted mb-4">
                  Saisissez l'identifiant d'un produit pour consulter sa traçabilité.
                </p>
                <form onSubmit={handleSubmit}>
                  <div className="input-group input-group-lg">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Exemple: PRD-2025-000123"
                      value={idRecherche}
                      onChange={e => setIdRecherche(e.target.value)}
                      style={{ borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }}
                    />
                    <button
                      className="btn btn-success px-4"
                      type="submit"
                      style={{ borderTopRightRadius: 12, borderBottomRightRadius: 12 }}
                    >
                      Voir le produit
                    </button>
                  </div>
                </form>
                <div className="text-center mt-3 small text-muted">
                  Astuce: l'identifiant peut être un code produit interne ou une référence.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EspaceClient;
