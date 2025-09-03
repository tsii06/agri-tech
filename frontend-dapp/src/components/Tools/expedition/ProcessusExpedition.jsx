import { useEffect, useState } from "react";
import ReactFlow, { MiniMap, Controls, Handle, Position } from "reactflow";
import "reactflow/dist/style.css";
import creerNodesProcessus from "./utilsProcessus";
import CustomNode, { ExpeditionNode } from "./CustomNode";

const nodeTypes = {
  custom: CustomNode,
  expeditionNode: ExpeditionNode
};

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
