import { Leaf, MapPin, Sprout } from "lucide-react";
import React from "react";
import { getIPFSURL } from "../../../utils/ipfsUtils";

const ParcelleDetails = ({ parcelle }) => {
  const handleMapRedirect = () => {
    if (parcelle.location && parcelle.location.lat && parcelle.location.lng) {
      const mapUrl = `https://www.google.com/maps?q=${parcelle.location.lat},${parcelle.location.lng}`;
      window.open(mapUrl, "_blank");
    }
  };

  return (
    <div
      className="p-4 border-bottom d-flex"
      style={{
        maxWidth: "100%",
        alignItems: "center",
      }}
    >
      <div style={{ flex: 1 }}>
        <h6 className="fw-bold my-2">
          <MapPin color="var(--madtx-green)" size={18} /> Parcelle #
          {parcelle.id || "n/a"}
        </h6>
        <p>
          <p className="text-muted small">Géolocalisation:</p>
          {parcelle.location && parcelle.location.lat && parcelle.location.lng ? (
            <button
              className="btn btn-link p-0 ms-2"
              onClick={handleMapRedirect}
              style={{ textDecoration: "underline", color: "var(--madtx-green)" }}
            >
              {`${parcelle.location.lat.toFixed(
                4
              )}, ${parcelle.location.lng.toFixed(4)}`}
            </button>
          ) : (
            "Non spécifiée"
          )}
        </p>
        <p className="small">
          <strong><Sprout size={18} color="var(--madtx-green)" /> Semences:</strong> {parcelle.qualiteSemence}
        </p>
        <p className="small">
          <strong><Leaf size={18} color="var(--madtx-green)" /> Méthode:</strong> {parcelle.methodeCulture}
        </p>
      </div>
      <div style={{ flexShrink: 0, marginLeft: "16px" }}>
        <img
          src={parcelle.photos.length > 0 ? getIPFSURL(parcelle.photos[0].cid) : "https://via.placeholder.com/100"}
          alt="Parcelle"
          style={{
            width: "100px",
            height: "100px",
            objectFit: "cover",
            borderRadius: "8px",
          }}
        />
      </div>
    </div>
  );
};

export default ParcelleDetails;
