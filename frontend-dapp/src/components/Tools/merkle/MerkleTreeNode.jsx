import { Handle, Position } from "reactflow";
import { Leaf, GitBranch, Package } from "lucide-react";

const MerkleTreeNode = ({ data }) => {
  let Icon;
  if (data.depth === 0) {
    Icon = Package; // Icon for root node
  } else if (data.isLeaf) {
    Icon = Leaf; // Icon for leaf nodes
  } else {
    Icon = GitBranch; // Icon for intermediate nodes
  }

  return (
    <div
      style={{
        padding: 10,
        border: "2px solid var(--madtx-green)",
        borderRadius: 8,
        backgroundColor: "#E8F5E9",
        textAlign: "center",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Icon size={24} color="var(--madtx-green)" style={{ marginBottom: 5 }} />
      <p style={{ fontSize: "0.85rem", color: "#555", margin: 0 }}>
        {data.label}
      </p>
      <p style={{ fontSize: "0.75rem", color: "#777", margin: 0 }}>
        {data.hash.slice(0, 6)}...{data.hash.slice(-4)}
      </p>
      <Handle type="source" position={Position.Bottom} style={{ background: "var(--madtx-green)" }} />
      <Handle type="target" position={Position.Top} style={{ background: "var(--madtx-green)" }} />
    </div>
  );
};

export default MerkleTreeNode;
