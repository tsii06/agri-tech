/* eslint-disable react/prop-types */
import ReactFlow, { MiniMap, Controls } from "reactflow";
import "reactflow/dist/style.css";
import CustomNode, { ConditionNode, ExpeditionNode, LotProduitNode, ParcelleNode, RecolteNode } from "./CustomNode";
import { useVisualisationProccessExpedition } from "../../../hooks/queries/useExpeditions";

const nodeTypes = {
  custom: CustomNode,
  expeditionNode: ExpeditionNode,
  conditionNode: ConditionNode,
  lotProduitNode: LotProduitNode,
  recolteNode: RecolteNode,
  parcelleNode: ParcelleNode
};

const ProcessusExpedition = ({ expedition, height="400px", background="" }) => {
  // Recuperation cache des nodes et edges.
  const { data, isFetching: isLoading } = useVisualisationProccessExpedition(expedition);
  const { nodesFinal: nodes = [], edgesFinal: edges = [] } = data || {};

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: height }}>
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
    <div style={{ height: height, background: background }}>
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView minZoom={0.2}>
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default ProcessusExpedition;
