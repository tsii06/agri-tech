import { useEffect, useState } from "react";
import ReactFlow, { MiniMap, Controls, Handle, Position } from "reactflow";
import "reactflow/dist/style.css";
import creerNodesProcessus from "./utils";

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

const nodeTypes = { custom: CustomNode };

const ProcessusExpedition = ({ expedition }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const chargerNodeEdge = async () => {
    const { nodesFinal, edgesFinal } = await creerNodesProcessus(expedition);
    setNodes(nodesFinal);
    setEdges(edgesFinal);
  };

  useEffect(() => {
    chargerNodeEdge();
  }, []);

  return (
    <div className="bg-light" style={{ height: "400px" }}>
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView>
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default ProcessusExpedition;
