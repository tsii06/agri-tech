import React, { useState, useCallback } from "react";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";
import MerkleTreeNode from "./MerkleTreeNode";
import { createMerkleTreeFromData } from "../../../utils/merkleUtils";

const nodeTypes = {
  merkleNode: MerkleTreeNode,
};

const VisualiserMerkleTree = () => {
  const data = ["tx1", "tx2", "tx3", "tx4", "tx5"];
  const { tree, hashes } = createMerkleTreeFromData(data);

  const generateNodesAndEdges = (node, depth = 0, x = 0, y = 0) => {
    const nodes = [
      {
        id: node.hash,
        type: "merkleNode",
        position: { x, y },
        data: { label: `Depth ${depth}`, hash: node.hash },
      },
    ];

    const edges = [];

    if (node.left) {
      const leftX = x - 150 / (depth + 1);
      const leftY = y + 100;
      const leftResult = generateNodesAndEdges(node.left, depth + 1, leftX, leftY);
      nodes.push(...leftResult.nodes);
      edges.push({ id: `${node.hash}-left-${depth}-${leftX}-${leftY}`, source: node.hash, target: node.left.hash });
      edges.push(...leftResult.edges);
    }

    if (node.right) {
      const rightX = x + 150 / (depth + 1);
      const rightY = y + 100;
      const rightResult = generateNodesAndEdges(node.right, depth + 1, rightX, rightY);
      nodes.push(...rightResult.nodes);
      edges.push({ id: `${node.hash}-right-${depth}-${rightX}-${rightY}`, source: node.hash, target: node.right.hash });
      edges.push(...rightResult.edges);
    }

    return { nodes, edges };
  };

  const { nodes, edges } = generateNodesAndEdges(tree);

  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const onInit = useCallback((instance) => {
    setReactFlowInstance(instance);
  }, []);

  return (
    <div style={{ width: "100%", height: "500px" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onInit={onInit}
        fitView
      >
        <MiniMap nodeColor={() => "#00ff00"} />
        <Controls />
        <Background color="#aaa" gap={16} />
      </ReactFlow>
    </div>
  );
};

export default VisualiserMerkleTree;