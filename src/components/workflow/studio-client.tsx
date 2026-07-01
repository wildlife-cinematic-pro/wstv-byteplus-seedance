"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react";
import { useWorkflowStore } from "@/lib/workflow/store";
import type { WstvNode, WstvEdge } from "@/lib/workflow/types";
import WstvNodeComponent from "./wstv-node";
import WstvEdgeComponent from "./wstv-edge";
import { HistoryPanel, NodeLibrary, SafetyCard, WorkflowTopBar } from "./panels";
import { Inspector } from "./inspector";

const nodeTypes: NodeTypes = { wstvNode: WstvNodeComponent };
const edgeTypes: EdgeTypes = { wstvEdge: WstvEdgeComponent };

function Canvas() {
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const onNodesChange = useWorkflowStore((s) => s.onNodesChange);
  const onEdgesChange = useWorkflowStore((s) => s.onEdgesChange);
  const onConnect = useWorkflowStore((s) => s.onConnect);
  const isValidConnection = useWorkflowStore((s) => s.isValidConnection);
  const selectNode = useWorkflowStore((s) => s.selectNode);

  return (
    <ReactFlow<WstvNode, WstvEdge>
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={(_e, node) => selectNode(node.id)}
      onPaneClick={() => selectNode(null)}
      isValidConnection={isValidConnection}
      fitView
      fitViewOptions={{ padding: 0.08, minZoom: 0.55, maxZoom: 1 }}
      proOptions={{ hideAttribution: true }}
      className="bg-background"
    >
      <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="rgba(255,255,255,0.08)" />
      <Controls className="!border-border !bg-card !text-foreground [&>button]:!border-border [&>button]:!bg-card [&>button]:!text-foreground" />
      <MiniMap
        className="!border !border-border !bg-card"
        maskColor="rgba(0,0,0,0.45)"
        nodeColor={(n) => (n.data ? (n.data as { color: string }).color : "#334155")}
      />
      <Panel position="top-left">
        <span className="text-[10px] text-muted-foreground bg-card/80 border border-border rounded px-2 py-1 backdrop-blur">
          Workflow Canvas · drag between ports to wire · Demo Mode
        </span>
      </Panel>
    </ReactFlow>
  );
}

export default function WorkflowStudio() {
  return (
    <div className="flex flex-col gap-3">
      <WorkflowTopBar />
      <div className="grid gap-3 lg:grid-cols-[210px_1fr_290px] lg:h-[calc(100vh-240px)]">
        <div className="hidden lg:flex h-full min-h-0">
          <NodeLibrary />
        </div>
        <div className="h-[58vh] lg:h-full min-h-[440px] rounded-xl border border-border bg-background overflow-hidden">
          <ReactFlowProvider>
            <Canvas />
          </ReactFlowProvider>
        </div>
        <div className="flex flex-col gap-3 h-full min-h-0">
          <div className="flex-1 min-h-0">
            <Inspector />
          </div>
          <SafetyCard />
        </div>
      </div>
      <div className="lg:hidden h-[340px]">
        <NodeLibrary />
      </div>
      <HistoryPanel />
    </div>
  );
}
