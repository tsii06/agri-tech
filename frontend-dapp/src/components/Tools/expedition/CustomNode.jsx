import { Handle, Position } from "reactflow";
import {
  Globe,
  Truck,
  Sprout,
  MapPin,
  CopyCheck,
  Copy,
  Package,
  ThermometerSnowflakeIcon,
  DropletsIcon,
  TimerIcon,
} from "lucide-react";
import { useState } from "react";

function CustomNode({ data }) {
  return (
    <div style={{ padding: 10, border: "2px solid #333", borderRadius: 8 }}>
      <h4>{data.label}</h4>
      {/* Point de sortie (droite) */}
      <Handle type="source" position={Position.Right} />
      {/* Point d’entrée (gauche) */}
      <Handle type="target" position={Position.Left} />
    </div>
  );
}

export const ExpeditionNode = ({ data }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text) => {
    const formattedText = text.startsWith("0x") ? text.slice(2) : text;
    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <div
      style={{
        padding: 15,
        border: "2px solid var(--madtx-green)",
        borderRadius: 10,
        backgroundColor: "#E8F5E9",
        textAlign: "center",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Globe
        size={32}
        color="var(--madtx-green)"
        style={{ marginBottom: 10 }}
      />
      <h3 style={{ margin: "5px 0", color: "var(--madtx-green)" }}>
        {data.ref}
      </h3>
      <p style={{ fontSize: "1rem", color: "#555", margin: "5px 0" }}>
        <strong>{data.nomProduit || "Aucun détail disponible"}</strong>
      </p>
      <p style={{ fontSize: "0.85rem", color: "#777", margin: "5px 0" }}>
        Quantité: {data.quantite || "Non spécifiée"} kg
      </p>
      <p style={{ fontSize: "0.85rem", color: "#777", margin: "5px 0" }}>
        Statut: {data.certifier ? "Certifier" : "Non certifier"}
      </p>
      <p style={{ fontSize: "0.85rem", color: "#777", margin: "5px 0" }}>
        RootMerkle:{" "}
        {data.rootMerkle
          ? data.rootMerkle.slice(0, 6) + "..." + data.rootMerkle.slice(-4)
          : "N/A"}
        {data.rootMerkle && (
          <button
            className="btn btn-link p-0 ms-2"
            onClick={() => copyToClipboard(data.rootMerkle)}
            style={{ textDecoration: "underline", color: "var(--madtx-green)" }}
          >
            {copied ? <CopyCheck size={16} /> : <Copy size={16} />}
          </button>
        )}
      </p>
      {/* Point de sortie (droite) */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "var(--madtx-green)" }}
      />
      {/* Point d’entrée (gauche) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "var(--madtx-green)" }}
      />
    </div>
  );
};

export const ConditionNode = ({ data }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text) => {
    const formattedText = text.startsWith("0x") ? text.slice(2) : text;
    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <div
      className="border border-primary bg-opacity-25"
      style={{
        padding: 15,
        border: "2px solid var(--madtx-green)",
        borderRadius: 10,
        backgroundColor: "#E8F5E9",
        textAlign: "center",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Truck className="text-primary" size={32} style={{ marginBottom: 10 }} />
      <h3 className="text-primary" style={{ margin: "5px 0" }}>
        {data.lieuDepart} - {data.destination}
      </h3>
      <p style={{ fontSize: "1rem", color: "#555", margin: "5px 0" }}>
        <strong><TimerIcon size={18} /> {data.dureeTransport || "Aucun détail disponible"} heures</strong>
      </p>
      <p style={{ fontSize: "0.85rem", color: "#777", margin: "5px 0" }}>
        <ThermometerSnowflakeIcon size={14} /> {data.temperature || "Non spécifiée"} °C&nbsp;-&nbsp;
        <DropletsIcon size={14} /> {data.humidite || "Non spécifiée"} %
      </p>
      <p style={{ fontSize: "0.85rem", color: "#777", margin: "5px 0" }}>
        HashMerkle:{" "}
        <strong>
          {data.hashMerkle
            ? data.hashMerkle.slice(0, 6) + "..." + data.hashMerkle.slice(-4)
            : "N/A"}
        </strong>
        {data.hashMerkle && (
          <button
            className="btn btn-link p-0 ms-2"
            onClick={() => copyToClipboard(data.hashMerkle)}
            style={{ textDecoration: "underline", color: "var(--madtx-green)" }}
          >
            {copied ? <CopyCheck size={16} /> : <Copy size={16} />}
          </button>
        )}
      </p>
      {/* Point de sortie (droite) */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "var(--madtx-green)" }}
      />
      {/* Point d’entrée (gauche) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "var(--madtx-green)" }}
      />
    </div>
  );
};

export const LotProduitNode = ({ data }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text) => {
    const formattedText = text.startsWith("0x") ? text.slice(2) : text;
    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <div
      style={{
        padding: 15,
        border: "2px solid var(--madtx-green)",
        borderRadius: 10,
        backgroundColor: "#E8F5E9",
        textAlign: "center",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Package
        size={32}
        color="var(--madtx-green)"
        style={{ marginBottom: 10 }}
      />
      <h3 style={{ margin: "5px 0", color: "var(--madtx-green)" }}>
        Lot Produit&nbsp;#{data.id || "N/A"}
      </h3>
      <p style={{ fontSize: "1rem", color: "#555", margin: "5px 0" }}>
        <strong>{data.nom || "N/A"}</strong>
      </p>
      <p style={{ fontSize: "0.85rem", color: "#777", margin: "5px 0" }}>
        Collecteur: {data.collecteur ? data.collecteur.nom : "Non spécifiée"}
      </p>
      <p style={{ fontSize: "0.85rem", color: "#777", margin: "5px 0" }}>
        Quantité: {data.quantite || "Non spécifiée"} kg
      </p>
      <p style={{ fontSize: "0.85rem", color: "#777", margin: "5px 0" }}>
        HashMerkle:{" "}
        <strong>
          {data.hashMerkle
            ? data.hashMerkle.slice(0, 6) + "..." + data.hashMerkle.slice(-4)
            : "N/A"}
        </strong>
        {data.hashMerkle && (
          <button
            className="btn btn-link p-0 ms-2"
            onClick={() => copyToClipboard(data.hashMerkle)}
            style={{ textDecoration: "underline", color: "var(--madtx-green)" }}
          >
            {copied ? <CopyCheck size={16} /> : <Copy size={16} />}
          </button>
        )}
      </p>
      {/* Point de sortie (droite) */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "var(--madtx-green)" }}
      />
      {/* Point d’entrée (gauche) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "var(--madtx-green)" }}
      />
    </div>
  );
};

export const RecolteNode = ({ data }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text) => {
    const formattedText = text.startsWith("0x") ? text.slice(2) : text;
    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <div
      style={{
        padding: 15,
        border: "2px solid var(--madtx-green)",
        borderRadius: 10,
        backgroundColor: "#E8F5E9",
        textAlign: "center",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Sprout
        size={32}
        color="var(--madtx-green)"
        style={{ marginBottom: 10 }}
      />
      <h3 style={{ margin: "5px 0", color: "var(--madtx-green)" }}>
        Recolte&nbsp;#{data.id}
      </h3>
      <p style={{ fontSize: "1rem", color: "#555", margin: "5px 0" }}>
        <strong>{data.nomProduit || "N/A"}</strong>
      </p>
      <p style={{ fontSize: "0.85rem", color: "#777", margin: "5px 0" }}>
        Quantité: {data.quantite || "Non spécifiée"} kg
      </p>
      <p style={{ fontSize: "0.85rem", color: "#777", margin: "5px 0" }}>
        Date de recolte: {data.dateRecolte || "Non spécifiée"}
      </p>
      <p style={{ fontSize: "0.85rem", color: "#777", margin: "5px 0" }}>
        Status: {data.certifie ? "Certifier" : "Non certifier"}
      </p>
      <p style={{ fontSize: "0.85rem", color: "#777", margin: "5px 0" }}>
        HashMerkle:{" "}
        <strong>
          {data.hashMerkle
            ? data.hashMerkle.slice(0, 6) + "..." + data.hashMerkle.slice(-4)
            : "N/A"}
        </strong>
        {data.hashMerkle && (
          <button
            className="btn btn-link p-0 ms-2"
            onClick={() => copyToClipboard(data.hashMerkle)}
            style={{ textDecoration: "underline", color: "var(--madtx-green)" }}
          >
            {copied ? <CopyCheck size={16} /> : <Copy size={16} />}
          </button>
        )}
      </p>
      {/* Point de sortie (droite) */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "var(--madtx-green)" }}
      />
      {/* Point d’entrée (gauche) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "var(--madtx-green)" }}
      />
    </div>
  );
};

export const ParcelleNode = ({ data }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text) => {
    const formattedText = text.startsWith("0x") ? text.slice(2) : text;
    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <div
      style={{
        padding: 15,
        border: "2px solid var(--madtx-green)",
        borderRadius: 10,
        backgroundColor: "#E8F5E9",
        textAlign: "center",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      <MapPin
        size={32}
        color="var(--madtx-green)"
        style={{ marginBottom: 10 }}
      />
      <h3 style={{ margin: "5px 0", color: "var(--madtx-green)" }}>
        Parcelle&nbsp;#{data.id}
      </h3>
      <p style={{ fontSize: "1rem", color: "#555", margin: "5px 0" }}>
        <span className="small" style={{color:"#777"}}>Producteur:</span>{" "}
        {data.producteur
          ? data.producteur.nom
          : "Non spécifiée"}
      </p>
      <p style={{ fontSize: "0.85rem", color: "#777", margin: "5px 0" }}>
        Localisation:
        {data.location && data.location.lat && data.location.lng
          ? `${data.location.lat.toFixed(4)}, ${data.location.lng.toFixed(4)}`
          : "Non spécifiée"}
      </p>
      <p style={{ fontSize: "0.85rem", color: "#777", margin: "5px 0" }}>
        HashMerkle:{" "}
        <strong>
          {data.hashMerkle
            ? data.hashMerkle.slice(0, 6) + "..." + data.hashMerkle.slice(-4)
            : "N/A"}
        </strong>
        {data.hashMerkle && (
          <button
            className="btn btn-link p-0 ms-2"
            onClick={() => copyToClipboard(data.hashMerkle)}
            style={{ textDecoration: "underline", color: "var(--madtx-green)" }}
          >
            {copied ? <CopyCheck size={16} /> : <Copy size={16} />}
          </button>
        )}
      </p>
      {/* Point de sortie (droite) */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "var(--madtx-green)" }}
      />
      {/* Point d’entrée (gauche) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "var(--madtx-green)" }}
      />
    </div>
  );
};

export default CustomNode;
