import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getContract } from "../../utils/contract";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  uploadCertificatPhytosanitaire,
  getIPFSURL,
} from "../../utils/ipfsUtils";
import { useUserContext } from "../../context/useContextt";
import { createParcelle } from "../../utils/contrat/producteur";

const defaultCenter = {
  lat: -18.8792,
  lng: 47.5079,
};

function LocationMarker({ setLocation }) {
  useMapEvents({
    click(e) {
      setLocation(e.latlng);
    },
  });

  return null;
}

function CreerParcelle() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(defaultCenter);

  // Données de la parcelle
  const [parcelleData, setParcelleData] = useState({
    qualiteSemence: "",
    methodeCulture: "",
    dateRecolte: "",
    photos: [],
    intrants: [],
    inspections: [],
  });

  // pour le certificat
  const [certificat, setCertificat] = useState(null);
  const dateEmission = useRef(null);
  const dateExpiration = useRef(null);
  const region = useRef(null);
  const autoriteCertificatrice = useRef(null);
  const numero_certificat = useRef(null);

  // adresse de l'user
  const { account } = useUserContext();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setParcelleData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    let cidCertificat = ""; // hash du certificat sur ipfs

    try {
      // UPLOADE CERTIFICAT PHYTOSANITAIRE
      if (!certificat) {
        throw new Error("Certificat phytosanitaire manquant");
      } else {
        // uploader d'abord le certificat
        const certificatData = {
          dateEmission: dateEmission.current.value,
          dateExpiration: dateExpiration.current.value,
          region: region.current.value,
          autoriteCertificatrice: autoriteCertificatrice.current.value,
          adresseProducteur: account,
          numeroCertificat: numero_certificat.current.value,
        };

        const upload = await uploadCertificatPhytosanitaire(
          certificat,
          certificatData
        );
        if (!upload.success) {
          throw new Error(
            upload.error || "Erreur lors de l'upload du certificat"
          );
        } else {
          cidCertificat = upload.cid;
        }
      }

      const res = await createParcelle(parcelleData, location, cidCertificat);
      if (!res) 
        setError("Impossible de créer la parcelle. Veuillez réessayer plus tard.");
      else 
        navigate("/mes-parcelles");
    } catch (error) {
      console.error("Erreur lors de la création de la parcelle:", error);
      setError(
        "Impossible de créer la parcelle. Veuillez réessayer plus tard."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Créer une nouvelle parcelle</h2>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label htmlFor="qualiteSemence" className="form-label">
                Qualité de la semence
              </label>
              <select
                className="form-control"
                required
                id="qualiteSemence"
                name="qualiteSemence"
                value={parcelleData.qualiteSemence}
                onChange={handleInputChange}
              >
                <option value=""></option>
                <option value="Certifiée">Certifiée</option>
                <option value="Locale traditionnelle">
                  Locale traditionnelle
                </option>
                <option value="Hybride améliorée">Hybride améliorée</option>
                <option value="Bio/Écologique">Bio/Écologique</option>
              </select>
            </div>

            <div className="mb-3">
              <label htmlFor="methodeCulture" className="form-label">
                Méthode de culture
              </label>
              <select
                className="form-control"
                required
                id="methodeCulture"
                name="methodeCulture"
                value={parcelleData.methodeCulture}
                onChange={handleInputChange}
              >
                <option value=""></option>
                <option value="Traditionnelle">Traditionnelle</option>
                <option value="Agroforesterie">Agroforesterie</option>
                <option value="Biologique">Biologique</option>
                <option value="Culture raisonnée">Culture raisonnée</option>
              </select>
            </div>

            <div className="mb-3">
              <label htmlFor="dateRecolte" className="form-label">
                Date de récolte prévue
              </label>
              <input
                type="date"
                className="form-control"
                id="dateRecolte"
                name="dateRecolte"
                value={parcelleData.dateRecolte}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Localisation de la parcelle</label>
              <div style={{ height: "300px" }}>
                <MapContainer
                  center={[location.lat, location.lng]}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <LocationMarker setLocation={setLocation} />
                  {location && (
                    <Marker position={[location.lat, location.lng]} />
                  )}
                </MapContainer>
              </div>
              <small className="form-text text-muted">
                Cliquez sur la carte pour définir l'emplacement de la parcelle
              </small>
            </div>
          </div>
        </div>

        {/* Section Certificat Phytosanitaire */}
        <div className="card mt-4">
          <div className="card-header">
            <h5>Certificat Phytosanitaire</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="certificat" className="form-label">
                    Fichier du certificat
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    id="certificat"
                    onChange={(e) => setCertificat(e.target.files[0])}
                    accept=".pdf,.doc,.docx"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="dateEmission" className="form-label">
                    Date d'émission
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    ref={dateEmission}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="dateExpiration" className="form-label">
                    Date d'expiration
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    ref={dateExpiration}
                    required
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="region" className="form-label">
                    Région
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    ref={region}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label
                    htmlFor="autoriteCertificatrice"
                    className="form-label"
                  >
                    Autorité certificatrice
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    ref={autoriteCertificatrice}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="numero_certificat" className="form-label">
                    Numéro du certificat
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    ref={numero_certificat}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Création en cours..." : "Créer la parcelle"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreerParcelle;
