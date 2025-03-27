import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getContract } from "../utils/contract";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const defaultCenter = {
  lat: -18.8792,
  lng: 47.5079
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
  const qualiteSemence = useRef("");
  const methodeCulture = useRef("");
  const dateRecolte = useRef("");
  const certificatPhytosanitaire = useRef("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const contract = await getContract();

      const tx = await contract.creerParcelle(
        qualiteSemence.current.value,
        methodeCulture.current.value,
        location.lat.toString(),
        location.lng.toString(),
        dateRecolte.current.value,
        certificatPhytosanitaire.current.value
      );

      await tx.wait();
      navigate("/mes-parcelles");

    } catch (error) {
      console.error("Erreur lors de la création de la parcelle:", error);
      setError("Impossible de créer la parcelle. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="h4 mb-3">Créer une nouvelle parcelle</h2>

      {error && (
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <div>{error}</div>
        </div>
      )}

      <form className="card shadow-sm p-4" onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label text-muted">Qualité des semences</label>
          <input type="text" className="form-control" required ref={qualiteSemence} />
        </div>

        <div className="mb-3">
          <label className="form-label text-muted">Méthode de culture</label>
          <input type="text" className="form-control" required ref={methodeCulture} />
        </div>


        <div className="mb-3">
          <label className="form-label text-muted">Date de récolte prévisionelle</label>
          <input type="date" className="form-control" required ref={dateRecolte} />
        </div>

        <div className="mb-3">
          <label className="form-label text-muted">Certificat phytosanitaire</label>
          <input type="text" className="form-control" required ref={certificatPhytosanitaire} />
        </div>

        <MapContainer center={location} zoom={12} style={{ height: '400px', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={location} />
          <LocationMarker setLocation={setLocation} />
        </MapContainer>

        <div className="mt-3 text-muted">
          Position sélectionnée : {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
        </div>

        <button
          disabled={loading}
          className={`btn w-100 mt-3 ${loading ? "btn-secondary disabled" : "btn-primary"}`}
        >
          {loading ? "Création en cours..." : "Créer la parcelle"}
        </button>
      </form>
    </div>
  );
}

export default CreerParcelle;
