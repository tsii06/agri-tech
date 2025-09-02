import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getDetailsExpeditionByRef } from "../../utils/contrat/exportateurClient";
import { Box } from "lucide-react";

const DetailsExpedition = ({}) => {
  const { reference } = useParams();
  const [expedition, setExpedition] = useState({});

  const chargerDetailsExpedition = async () => {
    const detailsExpedition = await getDetailsExpeditionByRef(reference);
    setExpedition(detailsExpedition);
  };

  useEffect(() => {
    chargerDetailsExpedition();
  }, []);

  // Ajustement de la carte pour occuper toute la largeur avec des marges réduites et affichage des détails sous forme de labels
  return (
    <div className="container py-4">
      <div
        className="card shadow-sm p-4"
        style={{ width: "100%", margin: "0 16px" }}
      >
        <h6 className="card-title text-start mb-2">
            <Box className="text-success" size={18} />&nbsp;Lot d'exportation
        </h6>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="text-muted">Référence</label> <br />
            <p className="card-text fw-bold badge bg-dark">{expedition.ref || "N/A"}</p>
          </div>
          <div className="col-md-6 mb-3">
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
          <div className="col-md-6 mb-3">
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
          <div className="col-md-6 mb-3">
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
          <div className="col-md-6 mb-3">
            <label className="text-muted">Destination</label>
            <p className="card-text fw-bold">
              {expedition.destination || "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsExpedition;
