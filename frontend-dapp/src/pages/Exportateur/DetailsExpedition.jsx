import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getAllHashMerkle,
  getConditionsTransportExpedition,
  getDetailsExpeditionByRef,
  getLotProduisExpedition,
  getParcellesExpedition,
  getRecoltesExpedition,
} from "../../utils/contrat/exportateurClient";
import {
  Box,
  ChevronDown,
  ChevronUp,
  MapPin,
  Truck,
  Copy,
  CopyCheck,
} from "lucide-react";
import ProcessusExpedition from "../../components/Tools/expedition/ProcessusExpedition";
import ParcelleDetails from "../../components/Tools/expedition/ParcelleDetails";
import RecolteDetails from "../../components/Tools/expedition/RecolteDetails";
import LotProduitDetails from "../../components/Tools/expedition/LotProduitDetails";
import LogistiqueDetails from "../../components/Tools/expedition/LogistiqueDetails";
import VisualiserMerkleTree from "../../components/Tools/merkle/VisualiserMerkleTree";

const DetailsExpedition = ({}) => {
  const { reference } = useParams();
  const [expedition, setExpedition] = useState({});
  const [parcelles, setParcelles] = useState([]);
  const [recoltes, setRecoltes] = useState([]);
  const [lotProduits, setLotProduits] = useState([]);
  const [conditionsTransport, setConditionsTransport] = useState([]);
  const [allHashesMerkle, setAllHashesMerkle] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [showProcess, setShowProcess] = useState(false);
  const [showParcelleProduction, setShowParcelleProduction] = useState(false);
  const [showRecoltes, setShowRecoltes] = useState(false);
  const [showProduits, setShowProduits] = useState(false);
  const [showLogistique, setShowLogistique] = useState(false);
  const [showArbreMerkle, setShowArbreMerkle] = useState(false);

  const chargerDetailsExpedition = async () => {
    setLoading(true);
    const detailsExpedition = await getDetailsExpeditionByRef(reference);
    const hashesMerkle = await getAllHashMerkle(detailsExpedition.idCommandeProduit);
    setExpedition(detailsExpedition);
    setAllHashesMerkle(hashesMerkle);
    setLoading(false);
  };

  const chargerParcelles = async () => {
    const parcellesExp = await getParcellesExpedition(expedition);
    setParcelles(parcellesExp);
  };

  const chargerRecoltes = async () => {
    const recoltesExp = await getRecoltesExpedition(expedition);
    setRecoltes(recoltesExp);
  };

  const chargerLotProduits = async () => {
    const lotProduitsExp = await getLotProduisExpedition(expedition);
    setLotProduits(lotProduitsExp);
  };

  const chargerConditionsTransport = async () => {
    const conditionsExp = await getConditionsTransportExpedition(expedition);
    setConditionsTransport(conditionsExp);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
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
                  <p className="card-text fw-bold">
                    {expedition.prix || "N/A"} €
                  </p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="text-muted">Exportateur</label>
                  <p className="card-text fw-bold">
                    {expedition.exportateur
                      ? expedition.exportateur.nom
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
                    {expedition.rootMerkle && (
                      <button
                        className="btn btn-link p-0 ms-2"
                        onClick={() => copyToClipboard(expedition.rootMerkle)}
                        style={{
                          textDecoration: "underline",
                          color: "var(--madtx-green)",
                        }}
                      >
                        {copied ? <CopyCheck size={16} /> : <Copy size={16} />}
                      </button>
                    )}
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
                style={{
                  cursor: "pointer",
                  transition: "background-color 0.3s ease",
                }}
                onClick={() => setShowProcess(!showProcess)}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f8f9fa")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "")
                }
              >
                <h6 className="mb-0 fw-bold">Visualisation des processus</h6>
                {showProcess ? <ChevronUp /> : <ChevronDown />}
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

            {/* Bloc Logistique */}
            <div
              className="card shadow-sm"
              style={{ width: "100%", margin: "0 auto" }}
            >
              <div
                className="d-flex align-items-center justify-content-between border-bottom p-4"
                style={{
                  cursor: "pointer",
                  transition: "background-color 0.3s ease",
                }}
                onClick={() => {
                  if (!showLogistique) chargerConditionsTransport();
                  setShowLogistique(!showLogistique);
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f8f9fa")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "")
                }
              >
                <h6 className="mb-0 fw-bold">Logistique</h6>
                {showLogistique ? <ChevronUp /> : <ChevronDown />}
              </div>
              <div
                className={`bg-light overflow-hidden px-4`}
                style={{
                  maxHeight: showLogistique ? "1000px" : "0",
                  transition: "max-height 0.5s ease-in-out",
                }}
              >
                <h6 className="card-title text-start my-4">
                  <span>
                    <Truck size={18} className="text-primary" /> Logistique
                  </span>
                </h6>
                {conditionsTransport.length > 0 &&
                  conditionsTransport.map((condition, index) => (
                    <LogistiqueDetails condition={condition} key={index} />
                  ))}
              </div>
            </div>

            {/* Bloc produits collecter */}
            <div
              className="card shadow-sm"
              style={{ width: "100%", margin: "0 auto" }}
            >
              <div
                className="d-flex align-items-center justify-content-between border-bottom p-4"
                style={{
                  cursor: "pointer",
                  transition: "background-color 0.3s ease",
                }}
                onClick={() => {
                  if (!showProduits) chargerLotProduits();
                  setShowProduits(!showProduits);
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f8f9fa")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "")
                }
              >
                <h6 className="mb-0 fw-bold">Produits collecter</h6>
                {showProduits ? <ChevronUp /> : <ChevronDown />}
              </div>
              <div
                className={`bg-light overflow-hidden`}
                style={{
                  maxHeight: showProduits ? "1000px" : "0",
                  transition: "max-height 0.5s ease-in-out",
                }}
              >
                {lotProduits.length > 0 &&
                  lotProduits.map((lotProduit) => (
                    <LotProduitDetails
                      lotProduit={lotProduit}
                      key={lotProduit.id}
                    />
                  ))}
              </div>
            </div>

            {/* Bloc iformation de recolte */}
            <div
              className="card shadow-sm"
              style={{ width: "100%", margin: "0 auto" }}
            >
              <div
                className="d-flex align-items-center justify-content-between border-bottom p-4"
                style={{
                  cursor: "pointer",
                  transition: "background-color 0.3s ease",
                }}
                onClick={() => {
                  if (!showRecoltes) chargerRecoltes();
                  setShowRecoltes(!showRecoltes);
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f8f9fa")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "")
                }
              >
                <h6 className="mb-0 fw-bold">Informations de recolte</h6>
                {showRecoltes ? <ChevronUp /> : <ChevronDown />}
              </div>
              <div
                className={`bg-light overflow-hidden`}
                style={{
                  maxHeight: showRecoltes ? "1000px" : "0",
                  transition: "max-height 0.5s ease-in-out",
                }}
              >
                {recoltes.length > 0 &&
                  recoltes.map((recolte) => (
                    <RecolteDetails recolte={recolte} key={recolte.id} />
                  ))}
              </div>
            </div>

            {/* Bloc Parcelle de production */}
            <div
              className="card shadow-sm"
              style={{ width: "100%", margin: "0 auto" }}
            >
              <div
                className="d-flex align-items-center justify-content-between border-bottom p-4"
                style={{
                  cursor: "pointer",
                  transition: "background-color 0.3s ease",
                }}
                onClick={() => {
                  if (!showParcelleProduction) chargerParcelles();
                  setShowParcelleProduction(!showParcelleProduction);
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f8f9fa")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "")
                }
              >
                <h6 className="mb-0 fw-bold">Parcelles de production</h6>
                {showParcelleProduction ? <ChevronUp /> : <ChevronDown />}
              </div>
              <div
                className={`bg-light overflow-hidden`}
                style={{
                  maxHeight: showParcelleProduction ? "1000px" : "0",
                  transition: "max-height 0.5s ease-in-out",
                }}
              >
                {parcelles.length > 0 &&
                  parcelles.map((parcelle) => (
                    <ParcelleDetails parcelle={parcelle} key={parcelle.id} />
                  ))}
              </div>
            </div>

            {/* Arbre de merkle */}
            <div
              className="card shadow-sm"
              style={{ width: "100%", margin: "0 auto" }}
            >
              <div
                className="d-flex align-items-center justify-content-between border-bottom p-4"
                style={{
                  cursor: "pointer",
                  transition: "background-color 0.3s ease",
                }}
                onClick={() => {
                  setShowArbreMerkle(!showArbreMerkle);
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f8f9fa")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "")
                }
              >
                <h6 className="mb-0 fw-bold">Arbre de merkle</h6>
                {showArbreMerkle ? <ChevronUp /> : <ChevronDown />}
              </div>
              <div
                className={`bg-light overflow-hidden`}
                style={{
                  maxHeight: showArbreMerkle ? "1000px" : "0",
                  transition: "max-height 0.5s ease-in-out",
                }}
              >
                <VisualiserMerkleTree hashes={allHashesMerkle} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailsExpedition;
