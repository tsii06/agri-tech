import { useEffect, useState } from "react";
import ReactFlow, { MiniMap, Controls, Handle, Position } from "reactflow";
import "reactflow/dist/style.css";
import creerNodesProcessus from "./utilsProcessus";
import CustomNode, { ConditionNode, ExpeditionNode, LotProduitNode, ParcelleNode, RecolteNode } from "./CustomNode";

const nodeTypes = {
  custom: CustomNode,
  expeditionNode: ExpeditionNode,
  conditionNode: ConditionNode,
  lotProduitNode: LotProduitNode,
  recolteNode: RecolteNode,
  parcelleNode: ParcelleNode
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
    <div style={{ height: "400px" }}>
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView minZoom={0.2}>
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default ProcessusExpedition;
