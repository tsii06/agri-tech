import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { uploadCertificatPhytosanitaire } from "../../utils/ipfsUtils";
import { useCreateParcelle } from "../../hooks/mutations/mutationParcelles";
import { useUserContext } from "../../context/useContextt";

const defaultCenter = {
  lat: -18.8792,
  lng: 47.5079,
};

// eslint-disable-next-line react/prop-types
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
  const { account } = useUserContext();
  
  // useMutation pour la creation de parcelle. Pour la maj de la cache
  const createParcelle = useCreateParcelle(account);

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
        const upload = await uploadCertificatPhytosanitaire(certificat, {
          timestamp: Date.now(),
        });
        if (!upload.success) {
          throw new Error(
            upload.error || "Erreur lors de l'upload du certificat"
          );
        } else {
          cidCertificat = upload.cid;
        }
      }

      // Excecute la fn mutation pour forcer le cache a se maj.
      const res = await createParcelle.mutateAsync(parcelleData, location, cidCertificat);
      if (!res)
        setError(
          "Impossible de créer la parcelle. Veuillez réessayer plus tard."
        );
      else navigate("/mes-parcelles");
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
                Cliquez sur la carte pour définir l&apos;emplacement de la
                parcelle
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
              <div className="col-md-12">
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
