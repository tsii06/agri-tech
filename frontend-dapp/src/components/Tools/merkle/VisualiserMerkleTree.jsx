import { useState, useCallback, useEffect } from "react";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";
import MerkleTreeNode from "./MerkleTreeNode";
import { getStructureMerkleTree } from "../../../utils/frontMerkleUtils";

const nodeTypes = {
  merkleNode: MerkleTreeNode,
};

const INTERVAL_X = 500;
const INTERVAL_Y = 200;

const VisualiserMerkleTree = ({ hashes }) => {
  // const tree = createMerkleTreeForReactFlow(hashes);
  const [nodes, setNodes] = useState();
  const [edges, setEdges] = useState();

  useEffect(() => {
    getStructureMerkleTree(hashes).then((res) => {
      const nodeAndEdge = generateNodesAndEdges(res.structure);
      let tempNodes = nodeAndEdge.nodes;
      let tempEdges = nodeAndEdge.edges;
      setNodes(tempNodes);
      setEdges(tempEdges);
    });
  }, []);

  const generateNodesAndEdges = (node, depth = 0, x = 0, y = 0) => {
    const nodes = [
      {
        id: node.hash,
        type: "merkleNode",
        position: { x, y },
        data: {
          label: `Niveau ${depth}`,
          hash: node.hash,
          depth: depth,
          isLeaf: !node.left && !node.right,
        },
      },
    ];

    const edges = [];

    if (node.left) {
      const leftX = x - INTERVAL_X / (depth + 1);
      const leftY = y + INTERVAL_Y;
      const leftResult = generateNodesAndEdges(
        node.left,
        depth + 1,
        leftX,
        leftY
      );
      nodes.push(...leftResult.nodes);
      edges.push({
        id: `${node.hash}-left-${depth}-${leftX}-${leftY}`,
        source: node.hash,
        target: node.left.hash,
      });
      edges.push(...leftResult.edges);
    }

    if (node.right) {
      const rightX = x + INTERVAL_X / (depth + 1);
      const rightY = y + INTERVAL_Y;
      const rightResult = generateNodesAndEdges(
        node.right,
        depth + 1,
        rightX,
        rightY
      );
      nodes.push(...rightResult.nodes);
      edges.push({
        id: `${node.hash}-right-${depth}-${rightX}-${rightY}`,
        source: node.hash,
        target: node.right.hash,
      });
      edges.push(...rightResult.edges);
    }

    return { nodes, edges };
  };

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
