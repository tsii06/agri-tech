import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getDetailsExpeditionByRef, getParcellesExpedition } from "../../utils/contrat/exportateurClient";
import { Box, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import ProcessusExpedition from "../../components/Tools/expedition/ProcessusExpedition";
import ParcelleDetails from "../../components/Tools/expedition/ParcelleDetails";

const DetailsExpedition = ({}) => {
  const { reference } = useParams();
  const [expedition, setExpedition] = useState({});
  const [parcelles, setParcelles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showProcess, setShowProcess] = useState(false);
  const [showParcelleProduction, setShowParcelleProduction] = useState(false);

  const chargerDetailsExpedition = async () => {
    setLoading(true);
    const detailsExpedition = await getDetailsExpeditionByRef(reference);
    setExpedition(detailsExpedition);
    setLoading(false);
  };

  const chargerParcelles = async () => {
    const parcellesExp = await getParcellesExpedition(expedition.idCommandeProduit);
    setParcelles(parcellesExp);
  };

  useEffect(() => {
    chargerDetailsExpedition();
  }, []);

  return (
    <div className="container py-4">
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="row">
          <div className="col-12">
            {/* Details expedition */}
            <div
              className="card shadow-sm p-4 mb-4 bg-light"
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
              className="card shadow-sm"
              style={{ width: "100%", margin: "0 auto" }}
            >
              <div
                className="d-flex align-items-center justify-content-between border-bottom p-4"
                style={{ cursor: "pointer", transition: "background-color 0.3s ease" }}
                onClick={() => setShowProcess(!showProcess)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8f9fa")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
              >
                <h6 className="mb-0 fw-bold">Visualisation des processus</h6>
                {showProcess ? (
                  <ChevronUp />
                ) : (
                  <ChevronDown />
                )}
              </div>
              <div
                className={`bg-light overflow-hidden`}
                style={{
                  maxHeight: showProcess ? "1000px" : "0",
                  transition: "max-height 0.5s ease-in-out",
                }}
              >
                <ProcessusExpedition expedition={expedition} />
              </div>
            </div>

            {/* Bloc Parcelle de production */}
            <div
              className="card shadow-sm"
              style={{ width: "100%", margin: "0 auto" }}
            >
              <div
                className="d-flex align-items-center justify-content-between border-bottom p-4"
                style={{ cursor: "pointer", transition: "background-color 0.3s ease" }}
                onClick={() => {
                  if (!showParcelleProduction) chargerParcelles();
                  setShowParcelleProduction(!showParcelleProduction);
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8f9fa")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
              >
                <h6 className="mb-0 fw-bold">Parcelles de production</h6>
                {showParcelleProduction ? (
                  <ChevronUp />
                ) : (
                  <ChevronDown />
                )}
              </div>
              <div
                className={`bg-light overflow-hidden`}
                style={{
                  maxHeight: showParcelleProduction ? "1000px" : "0",
                  transition: "max-height 0.5s ease-in-out",
                }}
              >
                {parcelles.map((parcelle) => (
                  <ParcelleDetails parcelle={parcelle} key={parcelle.id} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailsExpedition;
