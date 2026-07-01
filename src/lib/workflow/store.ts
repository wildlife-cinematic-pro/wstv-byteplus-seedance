import { create } from "zustand";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  MarkerType,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type OnConnect,
  type IsValidConnection,
} from "@xyflow/react";
import type {
  HistoryEntry,
  NodeKind,
  NodeStatus,
  PromptState,
  WstvEdge,
  WstvNode,
} from "./types";
import {
  DEFAULT_PROMPT,
  INITIAL_EDGES,
  INITIAL_NODES,
  createNode,
  makeHistoryEntry,
} from "./graph";

interface WorkflowState {
  nodes: WstvNode[];
  edges: WstvEdge[];
  selectedId: string;
  history: HistoryEntry[];
  busyAll: boolean;
  prompt: PromptState;
  onNodesChange: (changes: NodeChange<WstvNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<WstvEdge>[]) => void;
  onConnect: OnConnect;
  isValidConnection: IsValidConnection<WstvEdge>;
  selectNode: (id: string | null) => void;
  addNode: (kind: NodeKind) => void;
  runMock: (id: string) => void;
  runAll: () => void;
  resetAll: () => void;
  setPrompt: (key: keyof PromptState, value: string) => void;
  applyPreset: (prompt: PromptState) => void;
}

export const useWorkflowStore = create<WorkflowState>()((set, get) => {
  const setNodeStatus = (id: string, status: NodeStatus) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, status } } : n
      ),
    }));

  const pushHistory = (node: WstvNode) =>
    set((s) => ({ history: [makeHistoryEntry(node), ...s.history].slice(0, 50) }));

  const nodeById = (id: string) => get().nodes.find((n) => n.id === id);

  return {
    nodes: INITIAL_NODES,
    edges: INITIAL_EDGES,
    selectedId: INITIAL_NODES[0].id,
    history: [],
    busyAll: false,
    prompt: { ...DEFAULT_PROMPT },

    onNodesChange: (changes) =>
      set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) })),
    onEdgesChange: (changes) =>
      set((s) => ({ edges: applyEdgeChanges(changes, s.edges) })),

    onConnect: (connection) =>
      set((s) => {
        const source = s.nodes.find((n) => n.id === connection.source);
        const port = source?.data.outputs.find((p) => p.id === connection.sourceHandle);
        const color = port?.color ?? "#64748b";
        const next = addEdge<WstvEdge>(
          {
            ...connection,
            type: "wstvEdge",
            data: { color },
            markerEnd: { type: MarkerType.ArrowClosed, color },
          } as WstvEdge,
          s.edges
        );
        return { edges: next };
      }),

    isValidConnection: (edge) => {
      const { nodes } = get();
      const src = nodes.find((n) => n.id === edge.source);
      const tgt = nodes.find((n) => n.id === edge.target);
      const sPort = src?.data.outputs.find((p) => p.id === edge.sourceHandle);
      const tPort = tgt?.data.inputs.find((p) => p.id === edge.targetHandle);
      if (!sPort || !tPort) return false;
      return sPort.dataType === tPort.dataType;
    },

    selectNode: (id) => set({ selectedId: id ?? "" }),

    addNode: (kind) =>
      set((s) => {
        const count = s.nodes.length;
        const id = `${kind}-${Math.random().toString(36).slice(2, 7)}`;
        const node = createNode(kind, id, {
          x: 220 + (count % 6) * 36,
          y: 140 + (count % 6) * 36,
        });
        return { nodes: [...s.nodes, node], selectedId: id };
      }),

    runMock: (id) => {
      const node = nodeById(id);
      if (!node || node.data.status === "running demo") return;
      setNodeStatus(id, "running demo");
      window.setTimeout(() => {
        const current = get().nodes.find((n) => n.id === id);
        if (current) {
          setNodeStatus(id, "done");
          pushHistory(current);
        }
      }, 1200);
    },

    runAll: () => {
      if (get().busyAll) return;
      set({ busyAll: true });
      const order = [...get().nodes.map((n) => n.id)];
      let i = 0;
      const step = () => {
        if (i >= order.length) {
          set({ busyAll: false });
          return;
        }
        const id = order[i++];
        const node = get().nodes.find((n) => n.id === id);
        if (!node) return step();
        setNodeStatus(id, "running demo");
        window.setTimeout(() => {
          setNodeStatus(id, "done");
          pushHistory(node);
          step();
        }, 700);
      };
      step();
    },

    resetAll: () =>
      set((s) => ({
        nodes: s.nodes.map((n) => ({ ...n, data: { ...n.data, status: "ready" } })),
        history: [],
        busyAll: false,
      })),

    setPrompt: (key, value) =>
      set((s) => ({ prompt: { ...s.prompt, [key]: value } })),

    applyPreset: (prompt) => set({ prompt: { ...prompt }, selectedId: "master-prompt" }),
  };
});
