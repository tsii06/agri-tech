import { useState, useCallback } from "react";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";
import MerkleTreeNode from "./MerkleTreeNode";
import { createMerkleTree } from "../../../utils/merkleUtils";

const nodeTypes = {
  merkleNode: MerkleTreeNode,
};

const INTERVAL_X = 500;
const INTERVAL_Y = 200;

const VisualiserMerkleTree = ({ hashes }) => {
  const tree = createMerkleTree(hashes);
  
  const generateNodesAndEdges = (node, depth = 0, x = 0, y = 0) => {
    const nodes = [
      {
        id: node.hash,
        type: "merkleNode",
        position: { x, y },
        data: { label: `Niveau ${depth}`, hash: node.hash, depth:depth, isLeaf: !node.left && !node.right },
      },
    ];

    const edges = [];

    if (node.left) {
      const leftX = x - INTERVAL_X / (depth + 0.8);
      const leftY = y + INTERVAL_Y;
      const leftResult = generateNodesAndEdges(node.left, depth + 1, leftX, leftY);
      nodes.push(...leftResult.nodes);
      edges.push({ id: `${node.hash}-left-${depth}-${leftX}-${leftY}`, source: node.hash, target: node.left.hash });
      edges.push(...leftResult.edges);
    }

    if (node.right) {
      const rightX = x + INTERVAL_X / (depth + 0.8);
      const rightY = y + INTERVAL_Y;
      const rightResult = generateNodesAndEdges(node.right, depth + 1, rightX, rightY);
      nodes.push(...rightResult.nodes);
      edges.push({ id: `${node.hash}-right-${depth}-${rightX}-${rightY}`, source: node.hash, target: node.right.hash });
      edges.push(...rightResult.edges);
    }

    return { nodes, edges };
  };

  let { nodes, edges } = generateNodesAndEdges(tree);

  // Dupliquer les derniers noeuds si le nombre de feuilles est impair
  if (hashes.length % 2 !== 0 && hashes.length > 1) {
    const leafNodes = nodes.filter(n => n.data.isLeaf);
    const lastLeaf = leafNodes[leafNodes.length - 1];
    const duplicatedLeaf = {
      ...lastLeaf,
      id: `${lastLeaf.id}-dup`,
      position: { x: lastLeaf.position.x - (INTERVAL_X / (lastLeaf.data.depth - 1 + 0.8)) * 2, y: lastLeaf.position.y },
    };
    nodes.push(duplicatedLeaf);
    // recuper le edge qui pointe vers la derniere feuille
    const parentEdge = edges.find(e => e.target === lastLeaf.id);
    if (parentEdge) {
      edges.push({ ...parentEdge, id: `${parentEdge.id}-dup`, target: duplicatedLeaf.id });
    }
  }

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