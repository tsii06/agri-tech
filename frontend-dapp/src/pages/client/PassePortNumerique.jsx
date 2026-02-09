/* eslint-disable react-hooks/exhaustive-deps */
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle,
  MapPin,
  Leaf,
  CircleUserRound,
  ShieldCheck,
  Route,
  Package,
  ShieldAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import { apiGetAnchorExpedition } from "../../api/frontApiAnchorExpedition";
import { timestampToDate } from "../../utils/date";
import QRCode from "react-qr-code";
import { EXCLUDE_EXPEDITION, URL_BLOCK_SCAN } from "../../utils/contract";
import Skeleton from "react-loading-skeleton";
import { getIPFSURL, stringifyAll } from "../../utils/ipfsUtils";
import { initialRoleActeur } from "../../utils/roles";
import ProcessusExpedition from "../../components/Tools/expedition/ProcessusExpedition";
import { createMerkleTree } from "../../utils/frontMerkleUtils";
import {
  filtrerLotProduitData,
  filtrerParcelleData,
  filtrerRecolteData,
} from "../../utils/onChain/frontOnChainUtils";
import {
  useConditionsTransportExpedition,
  useExpeditionByRef,
  useLotsProduitsExpedition,
  useParcellesExpedition,
  useRecoltesExpedition,
} from "../../hooks/queries/useExpeditions";

// url : passe-port-numerique-client/:ref
function PassePortNumerique() {
  const { ref } = useParams();
  const [anchorExpedition, setAnchorExpedition] = useState(null);
  // les loadings flag
  const [firstLoading, setFirstLoading] = useState(true);
  const [authenticatLoading, setAuthenticateLoading] = useState("encours");
  useState(true);
  // navigateur
  const nav = useNavigate();

  // Recuperation cache de expeditions details
  const {
    data: expeditionVPS,
    isError: isErrorExpeditionVPS,
    isFetching: expeditionVPSLoading,
  } = useExpeditionByRef(ref || "");

  // Recuperation cache parcelles expedition
  const { data: parcellesVPS = [], isFetching: parcelleLoading = true } =
    useParcellesExpedition(expeditionVPS);

  // Recuperation cache recoltes expedition
  const { data: recoltesVPS = [], isFetching: recolteLoading = true } =
    useRecoltesExpedition(expeditionVPS);

  // Recuperation cache lots produits expedition
  const { data: lotProduitsVPS = [], isFetching: lotProduitLoading = true } =
    useLotsProduitsExpedition(expeditionVPS);

  // Recuperation cache lots produits expedition
  const {
    data: conditionsTransportVPS = [],
    isFetching: conditionTransportLoading = true,
  } = useConditionsTransportExpedition(expeditionVPS);

  console.log("Parcelles VPS : ", parcellesVPS);

  // Recuperation des acteurs
  let acteursVPS = [];
  // Producteur
  parcellesVPS.forEach((element) => acteursVPS.push(element.producteur));
  // Collecteurs
  lotProduitsVPS.forEach((element) => acteursVPS.push(element.collecteur));
  // Exportateurs
  if (expeditionVPS) acteursVPS.push(expeditionVPS.exportateur);

  // Recuperer l'expedition ancrer dans le mainnet
  useEffect(() => {
    apiGetAnchorExpedition(ref).then((res) => {
      console.log("Reponse watcher : ", res.data);
      setAnchorExpedition(res.data);
      setFirstLoading(false);
    });

    // renvoyer si le ref appartient a l'exclusion
    if (isErrorExpeditionVPS || (ref && EXCLUDE_EXPEDITION.includes(ref))) {
      alert("Probleme de reseaux ou reference invalide. Veuillez reessayer.");
      nav("/espace-client");
      return;
    }
  }, [ref]);

  // Afficher badge authentifier apres que tous les loading soient mis a false
  useEffect(() => {
    if (
      !firstLoading &&
      !expeditionVPSLoading &&
      !parcelleLoading &&
      !recolteLoading &&
      !lotProduitLoading &&
      !conditionTransportLoading
    ) {
      // Recuperation de tous les donnees anterieurs a l'expedition
      let allData = [];
      allData.push(...filtrerParcelleData(parcellesVPS));
      allData.push(...filtrerRecolteData(recoltesVPS));
      allData.push(...filtrerLotProduitData(lotProduitsVPS));
      allData.push(...conditionsTransportVPS);
      allData = stringifyAll(allData);
      // Reconstruction de l'arbre de merkle
      createMerkleTree(allData).then((tree) => {
        if (
          anchorExpedition.rootMerkle.toLowerCase() === tree.root.toLowerCase()
        )
          setAuthenticateLoading("authentique");
        else setAuthenticateLoading("falsifier");
      });
    }
  }, [
    firstLoading,
    expeditionVPSLoading,
    parcelleLoading,
    recolteLoading,
    lotProduitLoading,
    conditionTransportLoading,
  ]);

  // Les fonctions utilitaires
  const handleMapRedirect = (parcelle) => {
    if (parcelle.location && parcelle.location.lat && parcelle.location.lng) {
      const mapUrl = `https://www.google.com/maps?q=${parcelle.location.lat},${parcelle.location.lng}`;
      window.open(mapUrl, "_blank");
    }
  };
  const getTextBadgeAuthentification = (_isAuthenticateLoading) => {
    switch (_isAuthenticateLoading) {
      case "encours":
        return "ENCOURS D'AUTHENTIFICATION";
      case "authentique":
        return "AUTHENTIQUE & IMMUABLE";
      case "falsifier":
        return "DONNEES FALSIFIER";
      default:
        break;
    }
  };
  const getBackgroundBadgeAuthenticate = (_isAuthenticateLoading) => {
    switch (_isAuthenticateLoading) {
      case "encours":
        return "bg-secondary";
      case "authentique":
        return "bg-madtx-green";
      case "falsifier":
        return "bg-danger";
      default:
        break;
    }
  };
  const getIconBadgeAuthenticate = (_isAuthenticateLoading) => {
    switch (_isAuthenticateLoading) {
      case "encours":
        return (
          <span
            className="spinner-border spinner-border-sm text-light ms-2"
            role="status"
            aria-hidden="true"
          ></span>
        );
      case "authentique":
        return (
          <ShieldCheck
            className="text-light ms-2"
            style={{ display: "inline" }}
            size={20}
          />
        );
      case "falsifier":
        return (
          <ShieldAlert
            className="text-light ms-2"
            style={{ display: "inline" }}
            size={20}
          />
        );
      default:
        break;
    }
  };

  return (
    <div
      className="row justify-content-center py-4"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, var(--madtx-green) 0%, var(--madtx-blue) 100%)",
      }}
    >
      {firstLoading ? (
        <div
          style={{
            width: "90%",
            maxWidth: "900px",
          }}
        >
          <Skeleton width={"100%"} height={"100%"} style={{ minHeight: 100 }} />
        </div>
      ) : (
        <div
          className="card border-0 shadow p-0"
          style={{
            width: "90%",
            maxWidth: "900px",
            backgroundColor: "var(--madtx-gray)",
          }}
        >
          {/* Header */}
          <div className="card-body bg-light m-0">
            <div className="row align-items-center">
              <div className="col-md-6">
                <h2 className="mb-0">
                  <Package
                    className="text-success me-2"
                    size={30}
                    style={{ display: "inline" }}
                  />
                  MAD-TX
                </h2>
                <small className="text-muted">
                  Traçabilité de l&apos;Océan Indien
                </small>
              </div>
              <div className="col-md-6 text-end">
                <h4 className="mb-0" style={{ fontSize: "1.1rem" }}>
                  CERTIFICAT VÉRIFIÉ PAR BLOCKCHAIN
                </h4>
              </div>
            </div>
          </div>
          {/* Titre du Passeport */}
          <div className="card-body border-bottom text-center bg-light mx-4 mt-3">
            <h3 className="mb-0">
              PASSEPORT NUMÉRIQUE DU LOT {anchorExpedition.ref}
            </h3>
          </div>
          {/* Section 1: Preuve d'Ancrage */}
          <div className="card-body border-bottom bg-light mx-4 mt-3">
            <h5 className="card-title mb-3">
              <CheckCircle
                className="text-success me-2"
                style={{ display: "inline" }}
                size={20}
              />
              Preuve d&apos;Ancrage
            </h5>
            <div className="row">
              <div className="col-md-8">
                <p className="mb-2">
                  <span
                    className={`badge ${getBackgroundBadgeAuthenticate(
                      authenticatLoading
                    )} ms-2 p-3 text-center`}
                  >
                    {/* Texte du badge d'authentification */}
                    {getTextBadgeAuthentification(authenticatLoading)}
                    {/* Icone d'authentication */}
                    {getIconBadgeAuthenticate(authenticatLoading)}
                  </span>
                </p>
                <p className="mb-2">
                  <strong>Root Merkle:</strong>{" "}
                  {`${anchorExpedition.rootMerkle.substring(
                    0,
                    6
                  )}...${anchorExpedition.rootMerkle.substring(
                    anchorExpedition.rootMerkle.length - 4
                  )}`}
                </p>
                <p className="mb-0 text-muted">
                  <strong>Ancrage:</strong> Ancré sur Polygon le{" "}
                  {timestampToDate(anchorExpedition.horodatage)}
                </p>
              </div>
              <div className="col-md-4 text-end">
                <div className="bg-light rounded text-end">
                  <QRCode
                    value={URL_BLOCK_SCAN + anchorExpedition.txHash}
                    size={90}
                  />
                </div>
                <a
                  href={`${URL_BLOCK_SCAN + anchorExpedition.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm mt-2 text-white"
                  style={{ background: "var(--madtx-blue)" }}
                >
                  <strong>Voir transaction sur Polygon</strong>
                </a>
              </div>
            </div>
          </div>
          {/* Section 2: Origine & Producteur Certifiés */}
          <div className="card-body border-bottom bg-light mx-4 mt-3 pb-0">
            <h5 className="card-title mb-3">
              <MapPin
                className="text-success me-2"
                style={{ display: "inline" }}
                size={20}
              />
              Origine & Producteurs Certifiés
            </h5>
            {parcelleLoading ? (
              <div className="mb-3">
                <Skeleton
                  width={"100%"}
                  height={"100%"}
                  style={{ minHeight: 100 }}
                />
              </div>
            ) : (
              // Infos sur Producteur et ces parcelles
              parcellesVPS.length > 0 &&
              parcellesVPS.map((parcelle) => (
                <div className="row border-bottom" key={parcelle.id}>
                  <div className="col-md-6">
                    <div className="d-flex align-items-center mb-3">
                      <div className="fs-1 me-3">
                        <CircleUserRound
                          className="text-success"
                          size={40}
                          style={{ display: "inline" }}
                        />
                      </div>
                      <div>
                        <p className="mb-0">
                          <strong>Producteur:</strong> {parcelle.producteur.nom}
                        </p>
                        <p className="mb-0 text-muted">
                          ID : {parcelle.producteur.idBlockchain}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex align-items-center mb-3">
                      <div className="fs-1 me-3">
                        <div style={{ flexShrink: 0, marginLeft: "16px" }}>
                          <img
                            src={
                              parcelle.photos.length > 0
                                ? getIPFSURL(parcelle.photos[0].cid)
                                : "https://via.placeholder.com/100"
                            }
                            alt="Parcelle"
                            style={{
                              width: "70px",
                              height: "70px",
                              objectFit: "cover",
                              borderRadius: "5px",
                            }}
                          />
                        </div>
                      </div>
                      <strong>GPS:</strong>
                      {parcelle.location &&
                      parcelle.location.lat &&
                      parcelle.location.lng ? (
                        <button
                          className="btn btn-link p-0 ms-2"
                          onClick={() => handleMapRedirect(parcelle)}
                          style={{
                            textDecoration: "underline",
                            color: "var(--madtx-green)",
                          }}
                        >
                          {`${parcelle.location.lat.toFixed(
                            4
                          )}, ${parcelle.location.lng.toFixed(4)}`}
                        </button>
                      ) : (
                        "Non spécifiée"
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Section 3: Recolte & Acteurs */}
          <div className="card-body border-bottom bg-light mx-4 mt-3">
            <h5 className="card-title mb-3">
              <Leaf
                className="text-success me-2"
                style={{ display: "inline" }}
                size={20}
              />
              Recolte & Acteurs
            </h5>
            <div className="row">
              {/* Infos sur les recoltes */}
              {recolteLoading ? (
                <div className="col-md-6">
                  <Skeleton
                    width={"100%"}
                    height={"100%"}
                    style={{ minHeight: 100 }}
                  />
                </div>
              ) : (
                <div className="col-md-6">
                  <div className="mb-3">
                    <p className="mb-2">
                      <strong>Récolte:</strong> <br />
                      {/* Listes dates de recoltes */}
                      {recoltesVPS.length > 0 &&
                        recoltesVPS.map((recolte) => (
                          <span
                            className="badge"
                            style={{ background: "var(--madtx-green)" }}
                            key={recolte.id}
                          >
                            {recolte.dateRecolte}
                          </span>
                        ))}
                    </p>
                    <p className="mb-2">
                      <strong>Certification Phytonsanitaire:</strong> <br />
                      {/* Listes des certificats phytosanitaires des recoltes */}
                      {recoltesVPS.length > 0 &&
                        recoltesVPS.map((recolte, index) => (
                          <a
                            href={getIPFSURL(recolte.certificatPhytosanitaire)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm me-1 text-white"
                            key={recolte.id}
                            style={{ background: "var(--madtx-green)" }}
                          >
                            Certificat #{index + 1}
                          </a>
                        ))}
                    </p>
                  </div>
                </div>
              )}
              {/* Infos sur les acteurs */}
              {acteursVPS.length <= 0 ? (
                <div className="col-md-6">
                  <Skeleton
                    width={"100%"}
                    height={"100%"}
                    style={{ minHeight: 100 }}
                  />
                </div>
              ) : (
                <div className="col-md-6">
                  <p className="mb-3">
                    <strong>Acteurs:</strong>
                  </p>
                  <div className="row row-cols-4">
                    {acteursVPS.map((acteur, index) => (
                      <div
                        key={index}
                        className="col text-center"
                        style={{ flex: "0 0 auto" }}
                      >
                        <div
                          className="rounded-circle text-white d-flex align-items-center justify-content-center mx-auto mb-2"
                          style={{
                            width: "50px",
                            height: "50px",
                            fontSize: "18px",
                            fontWeight: "bold",
                            background: "var(--madtx-blue)",
                          }}
                        >
                          {initialRoleActeur(acteur.roles[0])}
                        </div>
                        <small className="d-block text-muted">
                          {acteur.nom}
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Section 4: Parcours Logistique & Qualité */}
          <div className="card-body border-bottom bg-light mx-4 mt-3">
            <h5 className="card-title mb-3">
              <Route
                className="text-success me-2"
                style={{ display: "inline" }}
                size={20}
              />
              Parcours Logistique & Qualité
            </h5>
            <div className="row">
              <div className="col-md-6">
                <p className="mb-2">
                  <strong>Conditions de Transport:</strong>
                </p>
                {/* Liste rapport de transport */}
                {conditionTransportLoading ? (
                  <div className="row-cols-4">
                    <Skeleton
                      width={"100%"}
                      height={"100%"}
                      style={{ minHeight: 100 }}
                    />
                  </div>
                ) : (
                  <div className="row-cols-4">
                    {conditionsTransportVPS.length > 0 &&
                      conditionsTransportVPS.map((condition, index) => (
                        <a
                          href={getIPFSURL(condition.cidRapportTransport)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="col btn btn-sm me-1 text-white"
                          key={index}
                          style={{ background: "var(--madtx-green)" }}
                        >
                          Rapport #{index + 1}
                        </a>
                      ))}
                  </div>
                )}
              </div>
              {/* Lieu de depart et de destination */}
              {expeditionVPSLoading ? (
                <div className="col-md-6">
                  <Skeleton
                    width={"100%"}
                    height={"100%"}
                    style={{ minHeight: 100 }}
                  />
                </div>
              ) : (
                <div className="col-md-6">
                  <p className="mb-2">
                    <strong>Port de depart:</strong> {expeditionVPS.lieuDepart}
                  </p>
                  <p className="mb-2">
                    <strong>Port de destination:</strong>{" "}
                    {expeditionVPS.destination}
                  </p>
                </div>
              )}
            </div>
            {/* Parcours producteur a exportateur */}
            <div className="mt-3">
              <p className="">
                <strong>Images du Parcours:</strong>
              </p>
              {expeditionVPSLoading ? (
                <div className="row">
                  <Skeleton
                    width={"100%"}
                    height={"100%"}
                    style={{ minHeight: 100 }}
                  />
                </div>
              ) : (
                <div className="row mx-1">
                  <ProcessusExpedition
                    expedition={expeditionVPS}
                    height="300px"
                    background="var(--madtx-gray)"
                  />
                </div>
              )}
            </div>
          </div>
          {/* Footer */}
          <div className="card-body text-center mt-3 mb-3">
            <small className="text-muted">
              <Leaf className="me-1" size={16} style={{ display: "inline" }} />
              MAD-TX | Traçabilité Alimentaire |
              <a href="mailto:contact@mad-tx.com" className="ms-1">
                contact@mad-tx.com
              </a>
            </small>
          </div>
        </div>
      )}
      {/* BTN DETAILS EXPEDITION */}
      <div className="d-flex justify-content-center mt-5">
        <Link
          className="btn btn-lg btn-agrichain"
          to={`/client-detail-expedition/${ref}`}
        >
          Détails
        </Link>
      </div>
    </div>
  );
}

export default PassePortNumerique;
