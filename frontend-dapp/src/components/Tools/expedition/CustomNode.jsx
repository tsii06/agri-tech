import { Handle, Position } from "reactflow";
import { Globe, Group, Truck, Sprout, MapPin } from "lucide-react";

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
        {data.nomProduit || "Aucun détail disponible"}
      </p>
      <p style={{ fontSize: "0.85rem", color: "#777", margin: "5px 0" }}>
        Quantité: {data.quantite || "Non spécifiée"} kg
      </p>
      <p style={{ fontSize: "0.85rem", color: "#777", margin: "5px 0" }}>
        Statut: {data.certifier ? "Certifier" : "Non certifier"}
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
        {data.dureeTransport || "Aucun détail disponible"} heures
      </p>
      <p style={{ fontSize: "0.85rem", color: "#777", margin: "5px 0" }}>
        Temperature: {data.temperature || "Non spécifiée"} °C
      </p>
      <p style={{ fontSize: "0.85rem", color: "#777", margin: "5px 0" }}>
        Humidite: {data.humidite || "Non certifier"} %
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
      <Group
        size={32}
        color="var(--madtx-green)"
        style={{ marginBottom: 10 }}
      />
      <h3 style={{ margin: "5px 0", color: "var(--madtx-green)" }}>
        Lot Produit&nbsp;#{data.id || "N/A"}
      </h3>
      <p style={{ fontSize: "1rem", color: "#555", margin: "5px 0" }}>
        {data.nom || "N/A"}
      </p>
      <p style={{ fontSize: "0.85rem", color: "#777", margin: "5px 0" }}>
        Collecteur:{" "}
        {data.collecteur
          ? data.collecteur.slice(0, 6) + "..."
          : "Non spécifiée"}
      </p>
      <p style={{ fontSize: "0.85rem", color: "#777", margin: "5px 0" }}>
        Quantité: {data.quantite || "Non spécifiée"} kg
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
        {data.nomProduit || "N/A"}
      </p>
      <p style={{ fontSize: "0.85rem", color: "#777", margin: "5px 0" }}>
        Producteur:{" "}
        {data.producteur
          ? data.producteur.nom
          : "Non spécifiée"}
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
        Producteur:{" "}
        {data.producteur
          ? data.producteur.slice(0, 6) + "..."
          : "Non spécifiée"}
      </p>
      <p style={{ fontSize: "0.85rem", color: "#777", margin: "5px 0" }}>
        Localisation:
        {data.location && data.location.lat && data.location.lng
          ? `${data.location.lat.toFixed(4)}, ${data.location.lng.toFixed(4)}`
          : "Non spécifiée"}
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
