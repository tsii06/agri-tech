import { useParams } from "react-router-dom";
import { CheckCircle, MapPin, Leaf, AlertCircle, QrCode } from "lucide-react";
import React, { useState } from "react";

// url : passe-port-numerique/:ref
function PassePortNumerique() {
  const { ref } = useParams();
  const [showQR, setShowQR] = useState(false);

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
        background: "linear-gradient(135deg, #24a752ff 0%, #4183c0ff 100%)",
      }}
    >
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
                Traçabilité de l'Océan Indien
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
            PASSEPORT NUMÉRIQUE DU LOT {passportData.reference}
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
            Preuve d'Ancrage
          </h5>
          <div className="row">
            <div className="col-md-8">
              <p className="mb-2">
                <strong>Status:</strong>
                <span className="badge bg-success ms-2">
                  {passportData.status}
                </span>
              </p>
              <p className="mb-2">
                <strong>Empreinte Blockchain (Root Merkle):</strong>{" "}
                {passportData.blockchainHash}
              </p>
              <p className="mb-0 text-muted">
                <strong>Ancrage:</strong> {passportData.anchoredDate}
              </p>
            </div>
            <div className="col-md-4 text-end">
              <button
                className="btn btn-info btn-sm"
                onClick={() => setShowQR(!showQR)}
              >
                <QrCode
                  size={16}
                  className="me-2"
                  style={{ display: "inline" }}
                />
                Voir Transaction
              </button>
            </div>
          </div>
          {showQR && (
            <div className="mt-3 p-3 bg-light rounded">
              <p className="text-muted text-center mb-0">
                Code QR - Transaction Polygon
              </p>
            </div>
          )}
        </div>

        {/* Section 2: Origine & Acteurs Certifiés */}
        <div className="card-body border-bottom bg-light mx-4 mt-3 mb-3">
          <h5 className="card-title mb-3">
            <MapPin
              className="text-danger me-2"
              style={{ display: "inline" }}
              size={20}
            />
            Origine & Acteurs Certifiés
          </h5>
          <div className="row">
            <div className="col-md-6">
              <div className="d-flex align-items-center mb-3">
                <div className="fs-1 me-3">{passportData.producer.image}</div>
                <div>
                  <p className="mb-0">
                    <strong>Producteur:</strong> {passportData.producer.name}
                  </p>
                  <p className="mb-0 text-muted">{passportData.producer.id}</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="alert alert-info mb-0" role="alert">
                <strong>Parcelle:</strong> Ambassadeur, Tamatave (GPS: -18.9°,
                49.2°C)
                <br />
                <strong>Superficie:</strong> {passportData.region.area}
              </div>
            </div>
          </div>
        </div>

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
    </div>
  );
}

export default PassePortNumerique;
