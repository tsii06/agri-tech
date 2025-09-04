import { Droplet, DropletOff, DropletsIcon, Thermometer, ThermometerIcon, ThermometerSnowflake, ThermometerSnowflakeIcon, ThermometerSun } from "lucide-react";
import React from "react";

const LogistiqueDetails = ({ condition }) => {
  const isTransportCE = condition.type.includes("produit");
  return (
    <div className="border p-3 my-3">
      <p className="fw-bold mb-1">
        {isTransportCE ? "Collecteur → Exportateur" : "Parcelle → Collecteur"}
      </p>
      <div
        className="d-flex align-items-center justify-content-between"
        style={{ width: "100%", margin: "0 auto" }}
      >
        <div>
          <p className="small mb-0">
            <span className="text-muted"><ThermometerSnowflakeIcon size={16} /> Température:</span> {condition.temperature || "N/A"} °C <br />
            <span className="text-muted"><DropletsIcon size={16} /> Humidité:</span> {condition.humidite || "N/A"} %
          </p>
        </div>
        <div>
          <p className="small mb-0">
            <span className="text-muted">Depart:</span> {condition.lieuDepart || "N/A"} <br />
            <span className="text-muted">Destination:</span> {condition.destination || "N/A"}
          </p>
        </div>
        <div>
          <span className="badge bg-white text-dark">
            {condition.dureeTransport || "N/A"} heures
          </span>
        </div>
      </div>
    </div>
  );
};

export default LogistiqueDetails;
