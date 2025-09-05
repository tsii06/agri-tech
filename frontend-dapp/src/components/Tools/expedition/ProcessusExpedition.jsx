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
  const [isLoading, setIsLoading] = useState(true); // État pour le chargement

  const chargerNodeEdge = async () => {
    try {
      const { nodesFinal, edgesFinal } = await creerNodesProcessus(expedition);
      setNodes(nodesFinal);
      setEdges(edgesFinal);
    } catch (error) {
      console.error("Erreur lors du chargement des nodes et edges:", error);
    } finally {
      setIsLoading(false); // Fin du chargement
    }
  };

  useEffect(() => {
    chargerNodeEdge();
  }, []);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
        <div className="custom-spinner"></div>
        <style>{`
          .custom-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-top: 4px solid #007bff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

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
