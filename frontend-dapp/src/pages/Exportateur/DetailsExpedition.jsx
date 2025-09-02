import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getDetailsExpeditionByRef } from "../../utils/contrat/exportateurClient";
import { Box, ChevronDown, ChevronUp } from "lucide-react";

const DetailsExpedition = ({}) => {
  const { reference } = useParams();
  const [expedition, setExpedition] = useState({});
  const [showProcess, setShowProcess] = useState(false);

  const chargerDetailsExpedition = async () => {
    const detailsExpedition = await getDetailsExpeditionByRef(reference);
    setExpedition(detailsExpedition);
  };

  useEffect(() => {
    chargerDetailsExpedition();
  }, []);

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-12">
          {/* Details expedition */}
          <div
            className="card shadow-sm p-4 mb-4"
            style={{ width: "100%", margin: "0 auto" }}
          >
            <h6 className="card-title text-start mb-2">
              <Box className="text-success" size={18} />
              &nbsp;Lot d'exportation
            </h6>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="text-muted">Référence</label> <br />
                <p className="card-text fw-bold badge bg-dark">
                  {expedition.ref || "N/A"}
                </p>
              </div>
              <div className="col-md-6 mb-3 text-end">
                <label className="text-muted">Quantité</label>
                <p className="card-text fw-bold">
                  {expedition.quantite || "N/A"} kg
                </p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="text-muted">Produit</label>
                <p className="card-text fw-bold">
                  {expedition.nomProduit || "N/A"}
                </p>
              </div>
              <div className="col-md-6 mb-3 text-end">
                <label className="text-muted">Prix</label>
                <p className="card-text fw-bold">{expedition.prix || "N/A"} €</p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="text-muted">Exportateur</label>
                <p className="card-text fw-bold">
                  {expedition.exportateur
                    ? expedition.exportateur.slice(0, 6) +
                      "..." +
                      expedition.exportateur.slice(-4)
                    : "N/A"}
                </p>
              </div>
              <div className="col-md-6 mb-3 text-end">
                <label className="text-muted">Merkle Root</label>
                <p className="card-text fw-bold">
                  {expedition.rootMerkle
                    ? expedition.rootMerkle.slice(0, 6) +
                      "..." +
                      expedition.rootMerkle.slice(-4)
                    : "N/A"}
                </p>
              </div>
              <hr />
              <div className="col-md-6 mb-3">
                <label className="text-muted">Depart</label>
                <p className="card-text fw-bold">
                  {expedition.lieuDepart || "N/A"}
                </p>
              </div>
              <div className="col-md-6 mb-3 text-end">
                <label className="text-muted">Destination</label>
                <p className="card-text fw-bold">
                  {expedition.destination || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Bloc Visualisation des processus */}
          <div
            className="card shadow-sm p-4"
            style={{ width: "100%", margin: "0 auto" }}
          >
            <div
              className="d-flex align-items-center justify-content-between"
              style={{ cursor: "pointer" }}
              onClick={() => setShowProcess(!showProcess)}
            >
              <h6 className="mb-0">Visualisation des processus</h6>
              {showProcess ? (
                <ChevronUp />
              ) : (
                <ChevronDown />
              )}
            </div>
            {showProcess && (
              <div className="mt-2">
                <h6 className="card-title">Visualisation des processus</h6>
                <p className="card-text">
                  Ce bloc contient des informations détaillées sur les processus liés à l'expédition.
                </p>
                {/* Ajoutez ici le contenu détaillé des processus */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsExpedition;
