import type { Node, Edge } from "@xyflow/react";

export type DataType = "prompt" | "image" | "panels" | "video" | "frame" | "video4k";

export type NodeKind =
  | "masterPrompt"
  | "masterImage"
  | "storyboard"
  | "seedanceVideo"
  | "extractFrame"
  | "continueVideo"
  | "upscale"
  | "export";

export type NodeStatus = "ready" | "running demo" | "done";

export type PreviewKind =
  | "master"
  | "image"
  | "story"
  | "video"
  | "frame"
  | "continue"
  | "upscale"
  | "export";

export interface Port {
  id: string;
  label: string;
  dataType: DataType;
  color: string;
}

export type WstvNodeData = {
  kind: NodeKind;
  title: string;
  type: string;
  color: string;
  icon: string;
  settings: string;
  preview: PreviewKind;
  previewLabel: string;
  summary: string;
  inputs: Port[];
  outputs: Port[];
  status: NodeStatus;
};

export type WstvNode = Node<WstvNodeData, "wstvNode">;
export type WstvEdge = Edge<{ color: string }, "wstvEdge">;

export interface PromptState {
  subject: string;
  environment: string;
  camera: string;
  lighting: string;
  realism: string;
  safety: string;
}

export interface Preset {
  id: string;
  name: string;
  icon: string;
  prompt: PromptState;
}

export interface HistoryEntry {
  id: string;
  nodeId: string;
  nodeTitle: string;
  label: string;
  time: string;
}

export const STATUS_LABEL: Record<NodeStatus, string> = {
  ready: "ready",
  "running demo": "running demo",
  done: "done",
};
