import { useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle,
  MapPin,
  Leaf,
  AlertCircle,
  Users,
  Shovel,
  UserRound,
  CircleUserRound,
  MapPinned,
} from "lucide-react";
import { useEffect, useState } from "react";
import { apiGetAnchorExpedition } from "../../api/anchorExpedition";
import { timestampToDate } from "../../utils/date";
import QRCode from "react-qr-code";
import { EXCLUDE_EXPEDITION, URL_BLOCK_SCAN } from "../../utils/contract";
import Skeleton from "react-loading-skeleton";
import {
  getDetailsExpeditionByRef,
  getParcellesExpedition,
} from "../../utils/contrat/exportateurClient";
import { getIPFSURL } from "../../utils/ipfsUtils";

// url : passe-port-numerique-client/:ref
function PassePortNumerique() {
  const { ref } = useParams();
  const [anchorExpedition, setAnchorExpedition] = useState(null);
  // les loadings flag
  const [firstLoading, setFirstLoading] = useState(true);
  const [authenticatLoading, setAuthenticateLoading] = useState(true);
  const [parcelleLoading, setParcelleLoading] = useState(true);
  // navigateur
  const nav = useNavigate();
  // valeurs utiles
  const [expeditionVPS, setExpeditionVPS] = useState({});
  const [parcellesVPS, setParcellesVPS] = useState({});

  // Recuperer l'expedition ancrer dans le mainnet
  useEffect(() => {
    apiGetAnchorExpedition(ref).then((res) => {
      console.log("Reponse watcher : ", res.data);
      setAnchorExpedition(res.data);
      setFirstLoading(false);
    });
  }, []);

  // Comparer rootMerkle du mainnet au blockchain privee
  useEffect(() => {
    if (!firstLoading) {
      chargerDetailsExpedition().then((data) => {
        setExpeditionVPS(data);
        if (
          anchorExpedition.rootMerkle.toLowerCase() ===
          data.rootMerkle.toLowerCase()
        )
          setAuthenticateLoading(false);
      });
    }
  }, [firstLoading]);

  // Afficher la section Origine & acteur certifiee
  useEffect(() => {
    chargerParcelles()
      .then((res) => {
        setParcellesVPS(res);
        setParcelleLoading(false);
      })
      .catch((err) => {
        console.error("Erreur recuperation parcelle depuis VPS : ", err);
      });
  }, [authenticatLoading]);

  // Les fonctions pour recuperer les data venant du VPS
  const chargerDetailsExpedition = async () => {
    // renvoyer si le ref appartient a l'exclusion
    if (ref && EXCLUDE_EXPEDITION.includes(ref)) {
      alert("Probleme de reseaux ou reference invalide. Veuillez reessayer.");
      nav("/espace-client");
      return;
    }
    const detailsExpedition = await getDetailsExpeditionByRef(ref);
    console.log(
      "Reception expedition details depuis VPS : ",
      detailsExpedition
    );
    return detailsExpedition;
  };
  const chargerParcelles = async () => {
    const parcellesExp = await getParcellesExpedition(expeditionVPS);
    console.log("Parcelle recuperer depuis VPS : ", parcellesExp);
    return parcellesExp;
  };

  // Les fonctions utilitaires
  const handleMapRedirect = (parcelle) => {
    if (parcelle.location && parcelle.location.lat && parcelle.location.lng) {
      const mapUrl = `https://www.google.com/maps?q=${parcelle.location.lat},${parcelle.location.lng}`;
      window.open(mapUrl, "_blank");
    }
  };

  // Données exemple - à remplacer par des données réelles
  const passportData = {
    reference: `EXP-2024-${ref || "001"}`,
    product: "Produits Agricoles Certifiés",
    status: "AUTHENTIQUE & IMMUABLE",
    blockchainHash: "0x7e88...1234",
    anchoredDate: "Ancré sur Polygon 25 à 10:30:15 UTC",
    producer: {
      name: "Coopérative Famadhy",
      id: "ID: 007",
      image: "👨‍🌾",
    },
    region: {
      name: "Tamatave (GPS: -18.9°, 49.2°C)",
      area: "25 hectares",
    },
    quality: {
      date: "Récolte: 15/07/2024",
      certification: "Certificat Bio Officiel (OPS)",
      bioPercent: "70%",
      temperature: "25°C (Stable)",
      actors: [
        { name: "Agriculteur", initial: "AG" },
        { name: "Collecteur", initial: "CO" },
        { name: "Exportateur", initial: "EX" },
        { name: "Auditeur", initial: "AU" },
      ],
    },
    logistics: {
      route: "Récolte > Transport > Stockage > Conditionnement: 25/07/2024",
      transport: "Camion Routier (PPS)",
      temperature: "500 kg",
      exportPort: "Bordeaux de Transport (PPS)",
      exportQuality: "25/07",
      certifications: ["Certificat Bio Officiel (OPS)"],
    },
    images: ["🌾", "🌱", "🌽"],
  };

  return (
    <div
      className="d-flex justify-content-center py-4"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, var(--madtx-green) 0%, var(--madtx-blue) 100%)",
      }}
    >
      {firstLoading ? (
        <div>Loading...</div>
      ) : (
        <div
          className="card border-0 shadow"
          style={{
            width: "90%",
            maxWidth: "900px",
            backgroundColor: "#e9e3e3ff",
          }}
        >
          {/* Header */}
          <div className="card-body bg-light">
            <div className="row align-items-center">
              <div className="col-md-6">
                <h2 className="mb-0">
                  <Leaf
                    className="text-success me-2"
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
          <div className="card-body border-bottom text-center bg-light mx-4 mt-3 mb-3">
            <h3 className="mb-0">
              PASSEPORT NUMÉRIQUE DU LOT {anchorExpedition.ref}
            </h3>
          </div>
          {/* Section 1: Preuve d'Ancrage */}
          <div className="card-body border-bottom bg-light mx-4 mt-3 mb-3">
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
                    className={`badge ${
                      authenticatLoading ? "bg-secondary" : "bg-success"
                    } ms-2`}
                  >
                    {authenticatLoading
                      ? "ENCOURS D'AUTHENTIFICATION..."
                      : "AUTHENTICATE & IMMUABLE"}
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
          {parcelleLoading ? (
            <div className="card-body mx-4 mt-3 mb-3">
              <Skeleton
                width={"100%"}
                height={"100%"}
                style={{ minHeight: 100 }}
              />
            </div>
          ) : (
            <div className="card-body border-bottom bg-light mx-4 mt-3 mb-3 pb-0">
              <h5 className="card-title mb-3">
                <MapPin
                  className="text-success me-2"
                  style={{ display: "inline" }}
                  size={20}
                />
                Origine & Producteurs Certifiés
              </h5>
              {/* Infos sur Producteur et ces parcelles */}
              {parcellesVPS.length > 0 &&
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
                            <strong>Producteur:</strong>{" "}
                            {parcelle.producteur.nom}
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
                ))}
            </div>
          )}
          {/* Section 3: Origine & Acteurs & Qualités */}
          <div className="card-body border-bottom bg-light mx-4 mt-3 mb-3">
            <h5 className="card-title mb-3">
              <Leaf
                className="text-success me-2"
                style={{ display: "inline" }}
                size={20}
              />
              Origine & Acteurs & Qualités
            </h5>
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <p className="mb-2">
                    <strong>Récolte:</strong>{" "}
                    <span className="badge bg-success">15/07/2024</span>
                  </p>
                  <p className="mb-2">
                    <strong>Certification:</strong>{" "}
                    <span className="badge bg-success">
                      Certificat Bio Officiel (OPS)
                    </span>
                  </p>
                  <p className="mb-0">
                    <strong>Bio:</strong>{" "}
                    <span className="badge bg-success">70%</span>
                  </p>
                </div>
              </div>
              <div className="col-md-6">
                <p className="mb-2">
                  <strong>Température:</strong> 25°C (Stable)
                </p>
                <p className="mb-3">
                  <strong>Acteurs:</strong>
                </p>
                <div className="d-flex gap-2 flex-wrap">
                  {passportData.quality.actors.map((actor, index) => (
                    <div
                      key={index}
                      className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                      style={{
                        width: "40px",
                        height: "40px",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      {actor.initial}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Section 4: Parcours Logistique & Qualité */}
          <div className="card-body border-bottom bg-light mx-4 mt-3 mb-3">
            <h5 className="card-title mb-3">
              <AlertCircle
                className="text-warning me-2"
                style={{ display: "inline" }}
                size={20}
              />
              Parcours Logistique & Qualité
            </h5>
            <div className="row">
              <div className="col-md-6">
                <p className="mb-2">
                  <strong>Itinéraire:</strong>
                </p>
                <p className="text-muted text-sm mb-3">
                  {passportData.logistics.route}
                </p>
                <p className="mb-2">
                  <strong>Méthode:</strong> Agricultture Raisonnée (Intrants
                  Naturels)
                </p>
              </div>
              <div className="col-md-6">
                <p className="mb-2">
                  <strong>Température:</strong>{" "}
                  {passportData.logistics.temperature}
                </p>
                <p className="mb-2">
                  <strong>Ports Export:</strong>{" "}
                  {passportData.logistics.exportPort}
                </p>
                <p className="mb-2">
                  <strong>Ports Export:</strong>{" "}
                  {passportData.logistics.exportQuality}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <p className="mb-2">
                <strong>Images du Parcours:</strong>
              </p>
              <div className="d-flex gap-2">
                {passportData.images.map((image, index) => (
                  <div key={index} className="rounded border p-2 fs-3">
                    {image}
                  </div>
                ))}
              </div>
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
    </div>
  );
}

export default PassePortNumerique;
