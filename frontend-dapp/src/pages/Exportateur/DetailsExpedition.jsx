/* eslint-disable react/no-unknown-property */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAllDataAnterieur } from "../../utils/contrat/exportateurClient";
import { Box, ChevronDown, ChevronUp, Truck } from "lucide-react";
import ProcessusExpedition from "../../components/Tools/expedition/ProcessusExpedition";
import ParcelleDetails from "../../components/Tools/expedition/ParcelleDetails";
import RecolteDetails from "../../components/Tools/expedition/RecolteDetails";
import LotProduitDetails from "../../components/Tools/expedition/LotProduitDetails";
import LogistiqueDetails from "../../components/Tools/expedition/LogistiqueDetails";
import VisualiserMerkleTree from "../../components/Tools/merkle/VisualiserMerkleTree";
import { getIPFSURL } from "../../utils/ipfsUtils";
import { EXCLUDE_EXPEDITION } from "../../utils/contract";
import QRCode from "react-qr-code";
import {
  useConditionsTransportExpedition,
  useExpeditionByRef,
  useLotsProduitsExpedition,
  useParcellesExpedition,
  useRecoltesExpedition,
} from "../../hooks/queries/useExpeditions";
import Skeleton from "react-loading-skeleton";

const DetailsExpedition = () => {
  const { reference } = useParams();
  const [allDataMerkle, setAllDataMerkle] = useState(["0x1"]);
  // const [copied, setCopied] = useState(false);

  const [showProcess, setShowProcess] = useState(true);
  const [showParcelleProduction, setShowParcelleProduction] = useState(true);
  const [showRecoltes, setShowRecoltes] = useState(true);
  const [showProduits, setShowProduits] = useState(true);
  const [showLogistique, setShowLogistique] = useState(true);
  const [showArbreMerkle, setShowArbreMerkle] = useState(false);

  const [isLoadingArbreMerkle, setIsLoadingArbreMerkle] = useState(true);
  const urlEspaceClient =
    window.location.protocol +
    "//" +
    window.location.host +
    "/client-detail-expedition/";

  const nav = useNavigate();

  // Recuperer details expedition dans cache si il y est.
  const {
    data: expedition,
    isError,
    isFetching: isFetchingExpedition,
  } = useExpeditionByRef(reference || "0");

  // Recuperation cache conditions transport expedition
  const { data: conditionsTransport = [], isFetching: isLoadingLogistique } =
    useConditionsTransportExpedition(expedition);

  // Recuperation cache lots produits expedition
  const { data: lotProduits = [], isFetching: isLoadingProduits } =
    useLotsProduitsExpedition(expedition);

  // Recuperation cache recoltes expedition
  const { data: recoltes = [], isFetching: isLoadingRecoltes } =
    useRecoltesExpedition(expedition);

  // Recuperation cache parcelles expedition
  const { data: parcelles = [], isFetching: isLoadingParcelles } =
    useParcellesExpedition(expedition);

  useEffect(() => {
    // renvoyer si le ref appartient a l'exclusion
    if (isError || (reference && EXCLUDE_EXPEDITION.includes(reference))) {
      alert("Probleme de reseaux ou reference invalide. Veuillez reessayer.");
      nav("/espace-client");
      return;
    }
  }, [isError, nav, reference]);

  const chargerAllHashesMerkle = async () => {
    const dataAnterieur = await getAllDataAnterieur(
      expedition.idCommandeProduit
    );
    setAllDataMerkle(dataAnterieur);
    setIsLoadingArbreMerkle(false);
  };

  // const copyToClipboard = (text) => {
  //   navigator.clipboard.writeText(text);
  //   setCopied(true);
  //   setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  // };

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-12">
          {/* Details expedition */}
          {isFetchingExpedition ? (
            <div
              className="card shadow-sm mb-4"
              style={{ width: "100%", margin: "0 auto" }}
            >
              <Skeleton
                width={"100%"}
                height={"100%"}
                style={{ minHeight: 200 }}
              />
            </div>
          ) : (
            <div
              className="card shadow-sm p-4 mb-4 bg-light"
              style={{ width: "100%", margin: "0 auto" }}
            >
              <h6 className="card-title text-start mb-2">
                <Box className="text-success" size={18} />
                &nbsp;Lot d&apos;exportation &nbsp;
                {expedition.certifier ? (
                  <span className="badge bg-success">Certifiée</span>
                ) : (
                  <span className="badge bg-warning">Pas encore certifiée</span>
                )}
              </h6>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="text-muted">Référence</label> <br />
                  <p className="card-text fw-bold badge bg-success">
                    {expedition.ref || "N/A"}
                  </p>
                </div>
                <div className="col-md-6 text-end">
                  <QRCode value={urlEspaceClient + expedition.ref} size={100} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="text-muted">Produit</label>
                  <p className="card-text fw-bold">
                    {expedition.nomProduit || "N/A"}
                  </p>
                </div>
                {/* Espace vide */}
                <div className="col-md-6"></div>
                <div className="col-md-6 mb-3">
                  <label className="text-muted">Prix</label>
                  <p className="card-text fw-bold">
                    {expedition.prix || "N/A"} €
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
                    {/* {expedition.rootMerkle && (
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
                    )} */}
                  </p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="text-muted">Quantité</label>
                  <p className="card-text fw-bold">
                    {expedition.quantite || "N/A"} kg
                  </p>
                </div>
                <div className="col-md-6 mb-3 text-end">
                  <label className="text-muted">Exportateur</label>
                  <p className="card-text fw-bold">
                    {expedition.exportateur
                      ? expedition.exportateur.nom
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
                <div className="col-md-6 mb-3">
                  <label className="text-muted">Type de transport</label>
                  <p className="card-text fw-bold">
                    {expedition.typeTransport || "N/A"}
                  </p>
                </div>
                <div className="col-md-6 mb-3 text-end">
                  <label className="text-muted">
                    Certificat Phytosanitaire
                  </label>
                  <p className="card-text fw-bold">
                    {expedition.cidCertificat ? (
                      <a
                        href={getIPFSURL(expedition.cidCertificat)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-success btn-sm"
                      >
                        Voir le certificat
                      </a>
                    ) : (
                      "Non disponible"
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

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
                setShowLogistique(!showLogistique);
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f8f9fa")
              }
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
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
              {isLoadingLogistique ? (
                <div className="text-center py-4">
                  <div className="spinner-grow text-success"></div>
                </div>
              ) : (
                conditionsTransport.length > 0 && (
                  <>
                    <h6 className="card-title text-start my-4">
                      <span>
                        <Truck size={18} className="text-primary" /> Logistique
                      </span>
                    </h6>
                    {conditionsTransport.map((condition, index) => (
                      <LogistiqueDetails condition={condition} key={index} />
                    ))}
                  </>
                )
              )}
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
                setShowProduits(!showProduits);
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f8f9fa")
              }
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
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
              {isLoadingProduits ? (
                <div className="text-center py-4">
                  <div className="spinner-grow text-success"></div>
                </div>
              ) : (
                lotProduits.length > 0 &&
                lotProduits.map((lotProduit) => (
                  <LotProduitDetails
                    lotProduit={lotProduit}
                    key={lotProduit.id}
                  />
                ))
              )}
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
                setShowRecoltes(!showRecoltes);
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f8f9fa")
              }
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
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
              {isLoadingRecoltes ? (
                <div className="text-center py-4">
                  <div className="spinner-grow text-success"></div>
                </div>
              ) : (
                recoltes.length > 0 &&
                recoltes.map((recolte) => (
                  <RecolteDetails recolte={recolte} key={recolte.id} />
                ))
              )}
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
                setShowParcelleProduction(!showParcelleProduction);
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f8f9fa")
              }
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
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
              {isLoadingParcelles ? (
                <div className="text-center py-4">
                  <div className="spinner-grow text-success"></div>
                </div>
              ) : (
                parcelles.length > 0 &&
                parcelles.map((parcelle) => (
                  <ParcelleDetails parcelle={parcelle} key={parcelle.id} />
                ))
              )}
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
              onClick={() => {
                setShowProcess(!showProcess);
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f8f9fa")
              }
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
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
              {expedition !== undefined && !isFetchingExpedition && (
                <ProcessusExpedition expedition={expedition} />
              )}
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
                if (!showArbreMerkle && isLoadingArbreMerkle)
                  chargerAllHashesMerkle();
                setShowArbreMerkle(!showArbreMerkle);
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f8f9fa")
              }
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
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
              {isLoadingArbreMerkle ? (
                <div
                  className="d-flex justify-content-center align-items-center"
                  style={{ height: "400px" }}
                >
                  <div className="custom-spinner"></div>
                  <style>
                    {`
                        .custom-spinner {
                          width: 40px;
                          height: 40px;
                          border: 4px solid rgba(0, 0, 0, 0.1);
                          border-top: 4px solid #007bff;
                          border-radius: 50%;
                          animation: spin 1s linear infinite;
                        }

                        @keyframes spin {
                          0% {
                            transform: rotate(0deg);
                          }
                          100% {
                            transform: rotate(360deg);
                          }
                        }
                      `}
                  </style>
                </div>
              ) : (
                <VisualiserMerkleTree hashes={allDataMerkle} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsExpedition;

<style jsx>{`
  .custom-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-top: 4px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`}</style>;
