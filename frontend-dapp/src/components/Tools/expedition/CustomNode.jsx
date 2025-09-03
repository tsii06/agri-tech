import { Handle, Position } from "reactflow";
import { Globe, Truck } from "lucide-react";

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
      <Globe size={32} color="var(--madtx-green)" style={{ marginBottom: 10 }} />
      <h3 style={{ margin: "5px 0", color: "var(--madtx-green)" }}>{data.ref}</h3>
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

export default CustomNode;
